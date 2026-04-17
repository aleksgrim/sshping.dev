package tester

import (
	"fmt"
	"golang.org/x/crypto/ssh"
)

func createAuthMethods(authType string, password *string, privateKey *string, passphrase *string) ([]ssh.AuthMethod, error) {
	var methods []ssh.AuthMethod
	if authType == "password" && password != nil {
		methods = append(methods, ssh.Password(*password))
	} else if authType == "key" && privateKey != nil {
		var signer ssh.Signer
		var err error
		if passphrase != nil && *passphrase != "" {
			signer, err = ssh.ParsePrivateKeyWithPassphrase([]byte(*privateKey), []byte(*passphrase))
		} else {
			signer, err = ssh.ParsePrivateKey([]byte(*privateKey))
		}
		if err != nil {
			return nil, fmt.Errorf("failed to parse private key: %w", err)
		}
		methods = append(methods, ssh.PublicKeys(signer))
	} else if authType == "keyboard_interactive" && password != nil {
		methods = append(methods, ssh.KeyboardInteractive(func(user, instruction string, questions []string, echos []bool) (answers []string, err error) {
			answers = make([]string, len(questions))
			for i := range answers {
				answers[i] = *password
			}
			return answers, nil
		}))
	}
	return methods, nil
}
