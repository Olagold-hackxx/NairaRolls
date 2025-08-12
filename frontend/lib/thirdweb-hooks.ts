import {
  useActiveAccount,
  useActiveWallet,
  useActiveWalletChain,
} from "thirdweb/react";
import { signMessage } from "thirdweb/utils";
import { useCallback } from "react";

// Custom hook to mimic useAccount
export const useAccount = () => {
  const account = useActiveAccount();
  return {
    address: account?.address,
    isConnected: !!account,
    account,
  };
};

// Custom hook to mimic useChainId
export const useChainId = () => {
  const activeChain = useActiveWalletChain();
  return activeChain?.id;
};

// Custom hook to mimic useSignMessage
export const useSignMessage = () => {
  const account = useActiveAccount();

  const signMessageAsync = useCallback(
    async (message: string) => {
      if (!account) throw new Error("No account connected");
      return await signMessage({ message, account });
    },
    [account]
  );

  return { signMessageAsync };
};

// Custom hook to mimic useAppKitProvider
export const useAppKitProvider = () => {
  const wallet = useActiveWallet();
  return { walletProvider: wallet };
};

// Utility function to check if wallet supports a method
export const walletSupports = (wallet: never, method: string): boolean => {
  return wallet && method in wallet && typeof wallet[method] === "function";
};