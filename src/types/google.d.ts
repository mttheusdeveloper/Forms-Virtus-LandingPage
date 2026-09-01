// Tipos mínimos da Google Identity Services (script carregado via <script> no
// index.html) — a lib não publica types próprios pra esse fluxo client-side.
export {};

declare global {
  interface GoogleTokenResponse {
    access_token: string;
    expires_in: number;
    scope: string;
    token_type: string;
    error?: string;
  }

  interface GoogleTokenClient {
    requestAccessToken(overrideConfig?: { prompt?: string }): void;
  }

  interface GoogleTokenClientConfig {
    client_id: string;
    scope: string;
    callback: (response: GoogleTokenResponse) => void;
    error_callback?: (error: { type: string }) => void;
  }

  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(config: GoogleTokenClientConfig): GoogleTokenClient;
          revoke(accessToken: string, callback?: () => void): void;
        };
      };
    };
  }
}
