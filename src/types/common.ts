export interface ApiResponse<T> {
  data: T[];
  links?: {
    self?: string;
    next?: string;
    prev?: string;
  };
  meta?: Record<string, any>;
}

export interface SingleApiResponse<T> {
  data: T;
  links?: {
    self?: string;
  };
  meta?: Record<string, any>;
}

export interface ResourceBase {
  type: string;
  id: string;
}

export interface ResourceWithAttributes<T> extends ResourceBase {
  attributes: T;
}

export interface ResourceWithRelationships<T> extends ResourceBase {
  relationships: T;
}

export interface ResourceComplete<T, R> extends ResourceWithAttributes<T> {
  relationships: R;
}

export type Platform = 'steam' | 'kakao' | 'xbox' | 'psn' | 'stadia' | 'console';

export type Shard =
  | 'steam'
  | 'pc-as'
  | 'pc-eu'
  | 'pc-jp'
  | 'pc-kakao'
  | 'pc-krjp'
  | 'pc-na'
  | 'pc-oc'
  | 'pc-ru'
  | 'pc-sa'
  | 'pc-sea'
  | 'pc-tournament'
  | 'xbox-as'
  | 'xbox-eu'
  | 'xbox-na'
  | 'xbox-oc'
  | 'xbox-sa'
  | 'psn-as'
  | 'psn-eu'
  | 'psn-na'
  | 'psn-oc'
  | 'stadia-as'
  | 'stadia-eu'
  | 'stadia-na'
  | 'stadia-oc'
  | 'console';

export type GameMode =
  | 'solo'
  | 'duo'
  | 'squad'
  | 'solo-fpp'
  | 'duo-fpp'
  | 'squad-fpp'
  | 'ranked-solo'
  | 'ranked-duo'
  | 'ranked-squad'
  | 'ranked-solo-fpp'
  | 'ranked-duo-fpp'
  | 'ranked-squad-fpp'
  | 'normal-solo'
  | 'normal-duo'
  | 'normal-squad'
  | 'normal-solo-fpp'
  | 'normal-duo-fpp'
  | 'normal-squad-fpp'
  | 'competitive'
  | 'esports'
  // Additional game modes from game-mode.json
  | 'conquest-duo'
  | 'conquest-duo-fpp'
  | 'conquest-solo'
  | 'conquest-solo-fpp'
  | 'conquest-squad'
  | 'conquest-squad-fpp'
  | 'esports-duo'
  | 'esports-duo-fpp'
  | 'esports-solo'
  | 'esports-solo-fpp'
  | 'esports-squad'
  | 'esports-squad-fpp'
  | 'war-duo'
  | 'war-duo-fpp'
  | 'war-solo'
  | 'war-solo-fpp'
  | 'war-squad'
  | 'war-squad-fpp'
  | 'zombie-duo'
  | 'zombie-duo-fpp'
  | 'zombie-solo'
  | 'zombie-solo-fpp'
  | 'zombie-squad'
  | 'zombie-squad-fpp'
  | 'lab-tpp'
  | 'lab-fpp'
  | 'tdm';

export type MapName =
  | 'Erangel_Main'
  | 'Desert_Main'
  | 'Savage_Main'
  | 'DihorOtok_Main'
  | 'Range_Main'
  | 'Baltic_Main'
  | 'Summerland_Main'
  | 'Chimera_Main'
  | 'Heaven_Main'
  | 'Kiki_Main'
  | 'Tiger_Main'
  | 'Neon_Main'
  | 'Rondo_Main'
  | 'Taego_Main';
