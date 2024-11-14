import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaNftAnchorHackernoon } from "../target/types/solana_nft_anchor_hackernoon";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import {
	findMasterEditionPda,
	findMetadataPda,
	mplTokenMetadata,
	MPL_TOKEN_METADATA_PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { publicKey } from "@metaplex-foundation/umi";

import {
	TOKEN_PROGRAM_ID,
	ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

describe("solana-nft-anchor-hackernoon", async() => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  // anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.SolanaNftAnchorHackernoon as Program<SolanaNftAnchorHackernoon>;

  const signer = provider.wallet;

  const umi = createUmi("https://api.devnet.solana.com")
    .use(walletAdapterIdentity(signer))
    .use(mplTokenMetadata());

  // generate the mint account
  const mint = anchor.web3.Keypair.generate();

  // Derive the associated token address account for the mint
  const associatedTokenAccount = await getAssociatedTokenAddress(
    mint.publicKey,
    signer.publicKey
  );

  // derive the metadata account
  let metadataAccount = findMetadataPda(umi, {
    mint: publicKey(mint.publicKey),
  })[0];

  //derive the master edition pda
  let masterEditionAccount = findMasterEditionPda(umi, {
    mint: publicKey(mint.publicKey),
  })[0];

  const metadata = {
		name: "Kobeni",
		symbol: "kBN",
		uri: "https://raw.githubusercontent.com/687c/solana-nft-native-client/main/metadata.json",
	};

  it("mints nft!", async () => {
    // Add your test here.
 
    const tx = await program.methods
			.initNft(metadata.name, metadata.symbol, metadata.uri)
			.accounts({
				signer: provider.publicKey,
				mint: mint.publicKey,
				associatedTokenAccount,
				metadataAccount,
				masterEditionAccount,
				tokenProgram: TOKEN_PROGRAM_ID,
				associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
				tokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
				systemProgram: anchor.web3.SystemProgram.programId,
				rent: anchor.web3.SYSVAR_RENT_PUBKEY,
			})
			.signers([mint])
			.rpc();

      console.log(
        `mint nft tx: https://explorer.solana.com/tx/${tx}?cluster=devnet`
      );
      console.log(
        `minted nft: https://explorer.solana.com/address/${mint.publicKey}?cluster=devnet`
      );
  });
});
