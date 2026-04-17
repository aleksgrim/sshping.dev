package tester

import (
	"bytes"
	"context"
	"crypto/tls"
	"fmt"
	"io"
	"net"
	"time"

	"github.com/jlaffaye/ftp"
	"github.com/sshping/sshping/internal/models"
)

type FTPRunner struct{}

func (r *FTPRunner) Run(ctx context.Context, req models.TestRequest, logger LogCallback) {
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
	logMessage(logger, "info", "connect", fmt.Sprintf("Connecting to FTP %s...", target))
	
	startConnect := time.Now()
	timeout := time.Duration(10) * time.Second
	if req.FTPOptions != nil && req.FTPOptions.DialTimeoutSeconds > 0 {
		timeout = time.Duration(req.FTPOptions.DialTimeoutSeconds) * time.Second
	}

	var options []ftp.DialOption
	options = append(options, ftp.DialWithTimeout(timeout))
	options = append(options, ftp.DialWithContext(ctx))

	if req.FTPOptions != nil && req.FTPOptions.TLSMode == "implicit" {
		options = append(options, ftp.DialWithTLS(&tls.Config{InsecureSkipVerify: req.FTPOptions.SkipTLSVerify}))
	} else if req.FTPOptions != nil && req.FTPOptions.TLSMode == "explicit" {
		options = append(options, ftp.DialWithExplicitTLS(&tls.Config{InsecureSkipVerify: req.FTPOptions.SkipTLSVerify}))
	}

	client, err := ftp.Dial(target, options...)
	if err != nil {
		logMessage(logger, "error", "connect", fmt.Sprintf("Failed to connect: %v", err))
		logMessage(logger, "error", "done", "Test failed")
		return
	}
	defer client.Quit()
	logMessage(logger, "success", "connect", "FTP connected", int(time.Since(startConnect).Milliseconds()))

	logMessage(logger, "info", "auth", "Authenticating...")
	startAuth := time.Now()
	pwd := ""
	if req.Auth.Password != nil {
		pwd = *req.Auth.Password
	}
	if err := client.Login(req.Connection.Username, pwd); err != nil {
		logMessage(logger, "error", "auth", fmt.Sprintf("Failed to authenticate: %v", err))
		logMessage(logger, "error", "done", "Test failed")
		return
	}
	logMessage(logger, "success", "auth", "Authenticated successfully", int(time.Since(startAuth).Milliseconds()))

	if req.FTPOptions != nil {
		ops := req.FTPOptions.Operations
		testPath := req.FTPOptions.TestPath
		if testPath == "" {
			testPath = "/"
		}

		for _, op := range ops {
			switch op {
			case "list":
				startList := time.Now()
				entries, err := client.List(testPath)
				if err != nil {
					logMessage(logger, "error", "probe/list", fmt.Sprintf("Failed to list dir %s: %v", testPath, err))
				} else {
					logMessage(logger, "success", "probe/list", fmt.Sprintf("Listed dir %s (%d items)", testPath, len(entries)), int(time.Since(startList).Milliseconds()))
				}
			case "write":
				startWrite := time.Now()
				data := []byte("sshping test data")
				err := client.Stor(testPath+"/sshping_test.tmp", bytes.NewReader(data))
				if err != nil {
					logMessage(logger, "error", "probe/write", fmt.Sprintf("Failed to write to file: %v", err))
				} else {
					logMessage(logger, "success", "probe/write", "Wrote test file sshping_test.tmp", int(time.Since(startWrite).Milliseconds()))
				}
			case "read":
				startRead := time.Now()
				resp, err := client.Retr(testPath + "/sshping_test.tmp")
				if err != nil {
					logMessage(logger, "error", "probe/read", fmt.Sprintf("Failed to read file: %v", err))
				} else {
					buf, _ := io.ReadAll(resp)
					resp.Close()
					logMessage(logger, "success", "probe/read", fmt.Sprintf("Read file (%d bytes)", len(buf)), int(time.Since(startRead).Milliseconds()))
				}
			case "delete":
				startDelete := time.Now()
				err := client.Delete(testPath + "/sshping_test.tmp")
				if err != nil {
					logMessage(logger, "error", "probe/delete", fmt.Sprintf("Failed to delete file: %v", err))
				} else {
					logMessage(logger, "success", "probe/delete", "Deleted test file", int(time.Since(startDelete).Milliseconds()))
				}
			}
		}
	}

	logMessage(logger, "success", "done", "All checks passed")
}
