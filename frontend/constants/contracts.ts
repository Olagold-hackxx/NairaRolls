import { ethers } from "ethers";
import NairaRollsMultisigFactoryABI from "./abi/NairaRollsMultisigFactory.json";

export const getGigContract = (providerOrSigner: ethers.Provider | ethers.Signer) =>
  new ethers.Contract(
    process.env.NAIRA_ROLLS_MULTISIG_FACTORY as string,
    NairaRollsMultisigFactoryABI,
    providerOrSigner
  );
