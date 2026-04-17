package tester

import (
	"context"
	"fmt"
	"net"
	"time"

	"github.com/pkg/sftp"
	"github.com/sshping/sshping/internal/models"
	"golang.org/x/crypto/ssh"
)

type SFTPRunner struct{}

func (r *SFTPRunner) Run(ctx context.Context, req models.TestRequest, logger LogCallback) {
	logMessage(logger, "info", "resolve", fmt.Sprintf("Resolving hostname %s...", req.Connection.Host))
	
	startResolve := time.Now()
	ips, err := net.LookupHost(req.Connection.Host)
	if err != nil {
		logMessage(logger, "error", "resolve", fmt.Sprintf("Failed to resolve hostname: %v", err))
		logMessage(logger, "error", "done", "Test failed")
		return
	}
	logMessage(logger, "success", "resolve", fmt.Sprintf("Resolved to %v", ips), int(time.Since(startResolve).Milliseconds()))

	target := fmt.Sprintf("%s:%d", req.Connection.Host, req.Connection.Port)
	logMessage(logger, "info", "connect", fmt.Sprintf("TCP connecting to %s...", target))
	
	startConnect := time.Now()
	timeout := time.Duration(10) * time.Second
	if req.SSHOptions.TimeoutSeconds > 0 {
		timeout = time.Duration(req.SSHOptions.TimeoutSeconds) * time.Second
	}

	authMethods, err := createAuthMethods(req.Auth.Type, req.Auth.Password, req.Auth.PrivateKey, req.Auth.PrivateKeyPassphrase)
	if err != nil {
		logMessage(logger, "error", "auth", fmt.Sprintf("Failed to prepare auth: %v", err))
		logMessage(logger, "error", "done", "Test failed")
		return
	}

	config := &ssh.ClientConfig{
		User:            req.Connection.Username,
		Auth:            authMethods,
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout:         timeout,
	}

	var finalClient *ssh.Client

	// Jump Host Logic
	if req.SSHOptions.JumpHost != nil && *req.SSHOptions.JumpHost != "" {
		jumpTarget := *req.SSHOptions.JumpHost
		logMessage(logger, "info", "jump", fmt.Sprintf("Dialing jump host %s...", jumpTarget))
		startJump := time.Now()

		var jumpAuthType string = req.Auth.Type
		var jumpPwd = req.Auth.Password
		var jumpKey = req.Auth.PrivateKey

		if req.SSHOptions.JumpHostAuthType != nil && *req.SSHOptions.JumpHostAuthType != "same" {
			jumpAuthType = *req.SSHOptions.JumpHostAuthType
			if jumpAuthType == "password" {
				jumpPwd = req.SSHOptions.JumpHostPassword
				jumpKey = nil
			} else if jumpAuthType == "key" {
				jumpPwd = nil
				jumpKey = req.SSHOptions.JumpHostKey
			}
		}

		jumpAuth, err := createAuthMethods(jumpAuthType, jumpPwd, jumpKey, nil)
		if err != nil {
			logMessage(logger, "error", "jump", fmt.Sprintf("Jump host auth prep failed: %v", err))
			logMessage(logger, "error", "done", "Test failed")
			return
		}

		jumpConfig := &ssh.ClientConfig{
			User:            req.Connection.Username,
			Auth:            jumpAuth,
			HostKeyCallback: ssh.InsecureIgnoreHostKey(),
			Timeout:         timeout,
		}

		jumpClient, err := ssh.Dial("tcp", jumpTarget, jumpConfig)
		if err != nil {
			logMessage(logger, "error", "jump", fmt.Sprintf("Jump host dial failed: %v", err))
			logMessage(logger, "error", "done", "Test failed")
			return
		}
		defer jumpClient.Close()
		logMessage(logger, "success", "jump", "Jump host connected", int(time.Since(startJump).Milliseconds()))

		bastionConn, err := jumpClient.Dial("tcp", target)
		if err != nil {
			logMessage(logger, "error", "handshake", fmt.Sprintf("Dial from jump host to target failed: %v", err))
			logMessage(logger, "error", "done", "Test failed")
			return
		}

		clientConn, chans, reqs, err := ssh.NewClientConn(bastionConn, target, config)
		if err != nil {
			bastionConn.Close()
			logMessage(logger, "error", "handshake", fmt.Sprintf("SSH Handshake via target failed: %v", err))
			logMessage(logger, "error", "done", "Test failed")
			return
		}
		finalClient = ssh.NewClient(clientConn, chans, reqs)
	} else {
		var dialer net.Dialer
		conn, err := dialer.DialContext(ctx, "tcp", target)
		if err != nil {
			logMessage(logger, "error", "connect", fmt.Sprintf("Failed to connect: %v", err))
			logMessage(logger, "error", "done", "Test failed")
			return
		}
		logMessage(logger, "success", "connect", "TCP connected", int(time.Since(startConnect).Milliseconds()))

		logMessage(logger, "info", "handshake", "SSH handshake started")
		startHandshake := time.Now()

		clientConn, chans, reqs, err := ssh.NewClientConn(conn, target, config)
		if err != nil {
			conn.Close()
			logMessage(logger, "error", "handshake", fmt.Sprintf("SSH Handshake / Auth failed: %v", err))
			logMessage(logger, "error", "done", "Test failed")
			return
		}
		finalClient = ssh.NewClient(clientConn, chans, reqs)
		logMessage(logger, "success", "handshake", "SSH handshake complete. Session authenticated", int(time.Since(startHandshake).Milliseconds()))
	}
	defer finalClient.Close()

	var bannerMsg = fmt.Sprintf("Server banner: %s", string(finalClient.ServerVersion()))
	logMessage(logger, "info", "info", bannerMsg)

	// SFTP Session
	logMessage(logger, "info", "sftp_init", "Creating SFTP client")
	
	var opts []sftp.ClientOption
	if req.SFTPOptions != nil && req.SFTPOptions.MaxPacket > 0 {
		opts = append(opts, sftp.MaxConcurrentRequestsPerFile(req.SFTPOptions.MaxPacket))
	}
	sftpClient, err := sftp.NewClient(finalClient, opts...)
	if err != nil {
		logMessage(logger, "error", "sftp_init", fmt.Sprintf("Failed to create SFTP client: %v", err))
		logMessage(logger, "error", "done", "Test failed")
		return
	}
	defer sftpClient.Close()
	logMessage(logger, "success", "sftp_init", "SFTP client created")

	if req.SFTPOptions != nil {
		ops := req.SFTPOptions.Operations
		testPath := req.SFTPOptions.TestPath
		if testPath == "" {
			testPath = "."
		}
		testFile := req.SFTPOptions.TestFilename
		if testFile == "" {
			testFile = "sshping_sftp_test.tmp"
		}
		fullPath := testPath + "/" + testFile

		for _, op := range ops {
			switch op {
			case "list":
				startList := time.Now()
				files, err := sftpClient.ReadDir(testPath)
				if err != nil {
					logMessage(logger, "error", "probe/list", fmt.Sprintf("Failed to list dir %s: %v", testPath, err))
				} else {
					logMessage(logger, "success", "probe/list", fmt.Sprintf("Listed dir %s (%d files)", testPath, len(files)), int(time.Since(startList).Milliseconds()))
				}
			case "write":
				startWrite := time.Now()
				file, err := sftpClient.Create(fullPath)
				if err != nil {
					logMessage(logger, "error", "probe/write", fmt.Sprintf("Failed to create file %s: %v", fullPath, err))
				} else {
					_, err = file.Write([]byte("sshping test"))
					file.Close()
					if err != nil {
						logMessage(logger, "error", "probe/write", fmt.Sprintf("Failed to write to file %s: %v", fullPath, err))
					} else {
						logMessage(logger, "success", "probe/write", fmt.Sprintf("Created and wrote to %s", fullPath), int(time.Since(startWrite).Milliseconds()))
					}
				}
			case "read":
				startRead := time.Now()
				file, err := sftpClient.Open(fullPath)
				if err != nil {
					logMessage(logger, "error", "probe/read", fmt.Sprintf("Failed to open file %s: %v", fullPath, err))
				} else {
					buf := make([]byte, 32)
					n, err := file.Read(buf)
					file.Close()
					if err != nil {
						logMessage(logger, "error", "probe/read", fmt.Sprintf("Failed to read file %s: %v", fullPath, err))
					} else {
						logMessage(logger, "success", "probe/read", fmt.Sprintf("Read %d bytes from %s: %s", n, fullPath, string(buf[:n])), int(time.Since(startRead).Milliseconds()))
					}
				}
			case "delete":
				startDelete := time.Now()
				err := sftpClient.Remove(fullPath)
				if err != nil {
					logMessage(logger, "error", "probe/delete", fmt.Sprintf("Failed to delete file %s: %v", fullPath, err))
				} else {
					logMessage(logger, "success", "probe/delete", fmt.Sprintf("Deleted file %s", fullPath), int(time.Since(startDelete).Milliseconds()))
				}
			}
		}
	}

	logMessage(logger, "success", "done", "All checks passed")
}
