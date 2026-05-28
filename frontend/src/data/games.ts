import anagramLogo from '../assets/games/anagram.svg';
import archeryLogo from '../assets/games/archery.svg';
import basketballLogo from '../assets/games/basketball.svg';
import checkersLogo from '../assets/games/checkers.svg';
import chessLogo from '../assets/games/chess.svg';
import miniGolfLogo from '../assets/games/mini-golf.svg';
import reversiLogo from '../assets/games/reversi.svg';
import snookerLogo from '../assets/games/snooker.svg';
import targetLogo from '../assets/games/target.svg';
import tictactoeLogo from '../assets/games/tic-tac-toe 2.svg';
import wordHuntLogo from '../assets/games/word hunt.svg';
import whotLogo from '../assets/games/whot.png';

export type GameCatalogStatus = 'playable' | 'coming_soon';

export interface GameCatalogItem {
  id: string;
  label: string;
  image: string;
  status: GameCatalogStatus;
  route?: string;
  engine: 'turn_based' | 'rng' | 'physics' | 'puzzle' | 'arcade';
  frontendStatus: 'live' | 'prototype_needed' | 'not_started';
  backendStatus: 'live' | 'planned' | 'not_started';
  turnTimerSeconds?: number;
}

export const gameCatalog: GameCatalogItem[] = [
  {
    id: 'tictactoe',
    label: 'Tic Tac Toe',
    image: tictactoeLogo,
    status: 'playable',
    route: '/matchmaking',
    engine: 'turn_based',
    frontendStatus: 'live',
    backendStatus: 'live',
    turnTimerSeconds: 10,
  },
  {
    id: 'whot',
    label: 'Whot! Cards',
    image: whotLogo,
    status: 'playable',
    route: '/matchmaking?gameType=whot',
    engine: 'turn_based',
    frontendStatus: 'live',
    backendStatus: 'live',
    turnTimerSeconds: 15,
  },
  {
    id: 'basketball',
    label: 'Basketball',
    image: basketballLogo,
    status: 'coming_soon',
    engine: 'physics',
    frontendStatus: 'prototype_needed',
    backendStatus: 'planned',
  },
  {
    id: 'snooker',
    label: 'Snooker',
    image: snookerLogo,
    status: 'coming_soon',
    engine: 'physics',
    frontendStatus: 'prototype_needed',
    backendStatus: 'planned',
  },
  {
    id: 'reversi',
    label: 'Reversi',
    image: reversiLogo,
    status: 'coming_soon',
    engine: 'turn_based',
    frontendStatus: 'prototype_needed',
    backendStatus: 'planned',
  },
  {
    id: 'archery',
    label: 'Archery',
    image: archeryLogo,
    status: 'coming_soon',
    engine: 'physics',
    frontendStatus: 'prototype_needed',
    backendStatus: 'planned',
  },
  {
    id: 'chess',
    label: 'Chess',
    image: chessLogo,
    status: 'playable',
    route: '/matchmaking?gameType=chess',
    engine: 'turn_based',
    frontendStatus: 'live',
    backendStatus: 'live',
    turnTimerSeconds: 20,
  },
  {
    id: 'checkers',
    label: 'Checkers',
    image: checkersLogo,
    status: 'coming_soon',
    engine: 'turn_based',
    frontendStatus: 'prototype_needed',
    backendStatus: 'planned',
  },
  {
    id: 'mini-golf',
    label: 'Mini Golf',
    image: miniGolfLogo,
    status: 'coming_soon',
    engine: 'physics',
    frontendStatus: 'prototype_needed',
    backendStatus: 'planned',
  },
  {
    id: 'target',
    label: 'Target',
    image: targetLogo,
    status: 'coming_soon',
    engine: 'physics',
    frontendStatus: 'prototype_needed',
    backendStatus: 'planned',
  },
  {
    id: 'word-hunt',
    label: 'Word Hunt',
    image: wordHuntLogo,
    status: 'coming_soon',
    engine: 'puzzle',
    frontendStatus: 'prototype_needed',
    backendStatus: 'planned',
  },
  {
    id: 'anagram',
    label: 'Anagram',
    image: anagramLogo,
    status: 'coming_soon',
    engine: 'puzzle',
    frontendStatus: 'prototype_needed',
    backendStatus: 'planned',
  },
];

export const playableGames = gameCatalog.filter((game) => game.status === 'playable');
export const comingSoonGames = gameCatalog.filter((game) => game.status === 'coming_soon');
export const ticTacToeGame = gameCatalog.find((game) => game.id === 'tictactoe')!;
