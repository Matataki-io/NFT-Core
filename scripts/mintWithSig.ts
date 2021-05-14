import fs from 'fs-extra';
import { JsonRpcProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { MediaFactory } from '../typechain/MediaFactory';
import Decimal from '../utils/Decimal';
import { BigNumber, BigNumberish, ethers, utils } from 'ethers';
import { Media } from '../typechain/Media';

type MintAndTransferWithSig = {
  contentHash: string;
  metadataHash: string;
  creatorShare: BigNumberish;
  to: string;
};

function getDeadline(days: number) {
  //          Now            + sec + min + hour * days
  return Math.floor(Date.now() / 1000) + 3600 * 24 * days;
}

async function signMintWithSig(
  wallet: Wallet,
  media: Media,
  chainId: number,
  verifyingContract: string,
  data: MintAndTransferWithSig
) {
  const deadline = getDeadline(365);
  const finalData = {
    ...data,
    contentHash: '0x' + data.contentHash,
    metadataHash: '0x' + data.metadataHash,
    deadline,
  };
  console.info('f', finalData);
  const contractName = await media.name();

  const result = await wallet._signTypedData(
    {
      name: contractName,
      version: '1',
      chainId,
      verifyingContract,
    },
    {
      MintWithSig: [
        { name: 'contentHash', type: 'bytes32' },
        { name: 'metadataHash', type: 'bytes32' },
        { name: 'creatorShare', type: 'uint256' },
        { name: 'to', type: 'address' },
        { name: 'deadline', type: 'uint256' },
      ],
    },
    finalData
  );
  const { r, s, v } = utils.splitSignature(result);
  return { sig: { r, s, v, deadline }, signer: wallet.address };
}

async function start() {
  const args = require('minimist')(process.argv.slice(2), {
    string: [
      'tokenURI',
      'metadataURI',
      'contentHash',
      'metadataHash',
      'gasPrice',
    ],
  });

  if (!args.chainId) {
    throw new Error('--chainId chain ID is required');
  }
  if (!args.tokenURI) {
    throw new Error('--tokenURI token URI is required');
  }
  if (!args.metadataURI) {
    throw new Error('--metadataURI metadata URI is required');
  }
  if (!args.contentHash) {
    throw new Error('--contentHash content hash is required');
  }
  if (!args.metadataHash) {
    throw new Error('--metadataHash content hash is required');
  }
  if (!args.creatorShare && args.creatorShare !== 0) {
    throw new Error('--creatorShare creator share is required');
  }
  const gasPrice = utils.parseUnits(args.gasPrice || '20', 'gwei');
  const path = `${process.cwd()}/.env${
    args.chainId === 1 ? '.prod' : args.chainId === 97 ? '.dev' : '.local'
  }`;
  await require('dotenv').config({ path });
  const provider = new JsonRpcProvider(process.env.RPC_ENDPOINT);
  // const wallet = new Wallet(`0x${process.env.PRIVATE_KEY}`, provider);
  const wallet = new Wallet(`0x${process.env.PRIVATE_KEY}`, provider);
  const sharedAddressPath = `${process.cwd()}/addresses/${args.chainId}.json`;
  // @ts-ignore
  const addressBook = JSON.parse(await fs.readFileSync(sharedAddressPath));
  if (!addressBook.media) {
    throw new Error(`Media contract has not yet been deployed`);
  }

  const media = MediaFactory.connect(addressBook.media, wallet);

  console.log(
    'Minting... ',
    args.tokenURI,
    args.contentHash,
    args.metadataURI,
    args.metadataHash
  );

  const to = '0xDDfc90C38c3e8F9D7AcC438a0f4919D164199c64';
  console.info('signing...');
  const { signer, sig } = await signMintWithSig(
    wallet,
    media,
    args.chainId,
    media.address,
    {
      contentHash: args.contentHash,
      metadataHash: args.metadataHash,
      creatorShare: Decimal.new(args.creatorShare).value,
      to,
    }
  );

  await media.mintAndTransferWithSig(
    signer,
    {
      tokenURI: args.tokenURI,
      metadataURI: args.metadataURI,
      contentHash: Uint8Array.from(Buffer.from(args.contentHash, 'hex')),
      metadataHash: Uint8Array.from(Buffer.from(args.metadataHash, 'hex')),
    },
    {
      prevOwner: Decimal.new(0),
      creator: Decimal.new(args.creatorShare),
      owner: Decimal.new(100 - args.creatorShare),
    },
    to,
    sig,
    { gasPrice }
  );

  console.log(`New piece is minted ☼☽`);
}

start().catch((e: Error) => {
  console.error(e);
  process.exit(1);
});
