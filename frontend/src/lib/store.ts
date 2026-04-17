import { create } from 'zustand';
import { TestFormState } from './types';

interface AppStore {
  form: TestFormState;
  setForm: (update: Partial<TestFormState>) => void;
  resetForm: () => void;
  
  sessionId: string | null;
  setSessionId: (id: string | null) => void;
}

const defaultForm: TestFormState = {
  protocol: 'ssh',
  host: '',
  port: 22,
  username: 'root',
  authType: 'password',
  timeoutSeconds: 10,
  hostKeyCheck: 'accept_new',
  jumpHostAuthType: 'same',
  sftpTestPath: '/tmp',
  sftpOperations: ['list', 'write', 'read', 'delete'],
  sftpMaxPacket: 32768,
  ftpPassiveMode: true,
  ftpTlsMode: 'explicit',
  ftpSkipTlsVerify: false,
  ftpDialTimeoutSeconds: 10,
  ftpTestPath: '/',
  ftpOperations: ['list', 'write', 'read', 'delete'],
};

export const useAppStore = create<AppStore>((set) => ({
  form: { ...defaultForm },
  setForm: (update) => set((state) => ({ form: { ...state.form, ...update } })),
  resetForm: () => set({ form: { ...defaultForm }, sessionId: null }),
  
  sessionId: null,
  setSessionId: (id) => set({ sessionId: id }),
}));

interface AuthStore {
  token: string;
  setToken: (t: string) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: '',
  setToken: (t) => set({ token: t }),
}));
