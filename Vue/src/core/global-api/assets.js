import { ASSET_TYPES } from 'shared/constants'
export function initAssetRegisters(Vue) {
    ASSET_TYPES.forEach(type => {
        console.log(type,'-------');
    });
}