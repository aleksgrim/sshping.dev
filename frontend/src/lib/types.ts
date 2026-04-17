export type AuthType = 'password' | 'key' | 'keyboard_interactive';

export interface TestFormState {
  protocol: string;
  host: string;
  port: number;
  username: string;
  
  authType: AuthType;
  password?: string;
  privateKey?: string;
  privateKeyPassphrase?: string;

  timeoutSeconds: number;
  hostKeyCheck: string;
  jumpHost?: string;
  jumpHostAuthType: string;
  jumpHostPassword?: string;
  jumpHostKey?: string;

  sftpTestPath: string;
  sftpOperations: string[];
  sftpMaxPacket: number;

  ftpPassiveMode: boolean;
  ftpTlsMode: string;
  ftpSkipTlsVerify: boolean;
  ftpDialTimeoutSeconds: number;
  ftpTestPath: string;
  ftpOperations: string[];
}
