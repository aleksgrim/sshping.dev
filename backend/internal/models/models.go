package models

type TestRequest struct {
	Protocol    string       `json:"protocol"` // "ssh", "sftp", "ftp", "ftps"
	Connection  Connection   `json:"connection"`
	Auth        Auth         `json:"auth"`
	SSHOptions  SSHOptions   `json:"ssh_options"`
	SFTPOptions *SFTPOptions `json:"sftp_options"`
	FTPOptions  *FTPOptions  `json:"ftp_options"`
}

type Connection struct {
	Host     string `json:"host"`
	Port     int    `json:"port"`
	Username string `json:"username"`
}

type Auth struct {
	Type                 string  `json:"type"` // "password", "key", "keyboard_interactive"
	Password             *string `json:"password"`
	PrivateKey           *string `json:"private_key"`
	PrivateKeyPassphrase *string `json:"private_key_passphrase"`
}

type SSHOptions struct {
	TimeoutSeconds   int      `json:"timeout_seconds"`
	HostKeyCheck     string   `json:"host_key_check"` // "accept_new", "ignore", "strict"
	KnownHost        *string  `json:"known_host"`
	Ciphers          []string `json:"ciphers"`
	KexAlgos         []string `json:"kex_algos"`
	Macs             []string `json:"macs"`
	Compression      bool     `json:"compression"`

	JumpHost             *string `json:"jump_host"`
	JumpHostAuthType     *string `json:"jump_host_auth_type"` // "same", "password", "key"
	JumpHostPassword     *string `json:"jump_host_password"`
	JumpHostKey          *string `json:"jump_host_key"`
}

type SFTPOptions struct {
	TestPath     string   `json:"test_path"`
	Operations   []string `json:"operations"`
	TestFilename string   `json:"test_filename"`
	MaxPacket    int      `json:"max_packet"`
}

type FTPOptions struct {
	PassiveMode        bool     `json:"passive_mode"`
	TLSMode            string   `json:"tls_mode"` // "explicit", "implicit", ""
	SkipTLSVerify      bool     `json:"skip_tls_verify"`
	DialTimeoutSeconds int      `json:"dial_timeout_seconds"`
	TestPath           string   `json:"test_path"`
	Operations         []string `json:"operations"`
}

type LogMessage struct {
	Timestamp  string `json:"ts"`
	Level      string `json:"level"` // "info", "success", "error", "warn"
	Stage      string `json:"stage"`
	Message    string `json:"message"`
	DurationMs *int   `json:"duration_ms,omitempty"`
}

type SessionStatus struct {
	SessionID string `json:"session_id"`
	Status    string `json:"status"`
}
