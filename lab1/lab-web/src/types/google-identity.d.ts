interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleAccountsId {
  initialize(input: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }): void;
  renderButton(parent: HTMLElement, options: Record<string, unknown>): void;
  prompt(): void;
}

interface GoogleNamespace {
  accounts: {
    id: GoogleAccountsId;
  };
}

interface Window {
  google?: GoogleNamespace;
}
