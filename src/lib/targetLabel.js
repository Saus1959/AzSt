// Human-readable "who is it for" for a task or news item; t = useT().
export function targetLabel(item, t) {
  switch (item.targetScope) {
    case 'GLOBAL': return t('scopeGlobal');
    case 'GROUP': return t('scopeGroup');
    case 'AREA': return `${t('scopeArea')}: ${t('area_' + item.targetArea)}`;
    case 'DEPO': return t('depot_' + item.targetDepot);
    default: return '';
  }
}
