import { ethers } from "ethers";
import BatchPayrollMultisigABI from "./abi/BatchPayrollMultisigABI.json";

export const getGigContract = (providerOrSigner: ethers.Provider | ethers.Signer) =>
  new ethers.Contract(
    process.env.NAIRA_ROLLS_MULTISIG_FACTORY as string,
    BatchPayrollMultisigABI,
    providerOrSigner
  );
