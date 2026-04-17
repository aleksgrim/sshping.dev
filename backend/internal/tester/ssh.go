package tester

import (
	"context"
	"fmt"
	"net"
	"time"

	"github.com/sshping/sshping/internal/models"
	"golang.org/x/crypto/ssh"
)

type SSHRunner struct{}

func (r *SSHRunner) Run(ctx context.Context, req models.TestRequest, logger LogCallback) {
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
	
// Setup auth methods
	authMethods, err := createAuthMethods(req.Auth.Type, req.Auth.Password, req.Auth.PrivateKey, req.Auth.PrivateKeyPassphrase)
	if err != nil {
		logMessage(logger, "error", "auth", fmt.Sprintf("Failed to prepare auth: %v", err))
		logMessage(logger, "error", "done", "Test failed")
		return
	}

	hostKeyCallback := ssh.InsecureIgnoreHostKey()

	config := &ssh.ClientConfig{
		User:            req.Connection.Username,
		Auth:            authMethods,
		HostKeyCallback: hostKeyCallback,
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
			User:            req.Connection.Username, // Assuming same user for bastion if none specified. A proper implementation would split user@host:port for jump host. Let's keep it simple.
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
		// Normal connect without Jump Host
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

	// Probe
	logMessage(logger, "info", "probe", "Running probe: echo sshping_ok")
	startProbe := time.Now()
	
	session, err := finalClient.NewSession()
	if err != nil {
		logMessage(logger, "error", "probe", fmt.Sprintf("Failed to create SSH session: %v", err))
		logMessage(logger, "error", "done", "Test failed")
		return
	}
	defer session.Close()

	out, err := session.CombinedOutput("echo sshping_ok")
	if err != nil {
		logMessage(logger, "error", "probe", fmt.Sprintf("Probe failed: %v (output: %s)", err, string(out)))
		logMessage(logger, "error", "done", "Test failed")
		return
	}

	logMessage(logger, "success", "probe", fmt.Sprintf("Probe OK: %s", string(out)), int(time.Since(startProbe).Milliseconds()))
	logMessage(logger, "success", "done", "All checks passed")
}
