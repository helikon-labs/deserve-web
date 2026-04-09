import { atom } from 'nanostores';
import type { Chain } from './node';

const selectedChain = atom<Chain>('asset-hub');

const GEO_ENDPOINTS: Record<Chain, string> = {
    'asset-hub': 'wss://asset-hub.polkadot.rpc.deserve.network',
    coretime: 'wss://coretime.polkadot.rpc.deserve.network',
};

const CHAIN_LABELS: Record<Chain, string> = {
    'asset-hub': 'Asset Hub',
    coretime: 'Coretime',
};

const CHAIN_SUBTITLES: Record<Chain, string> = {
    'asset-hub': 'Polkadot Asset Hub Archive RPC Deployment',
    coretime: 'Polkadot Coretime RPC Deployment',
};

export { selectedChain, GEO_ENDPOINTS, CHAIN_LABELS, CHAIN_SUBTITLES };
