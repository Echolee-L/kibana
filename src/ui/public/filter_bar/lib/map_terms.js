import _ from 'lodash';
export default function mapTermsProvider(Promise, courier) {
  return function (filter) {
    let key;
    let value;
    let field;
    if (filter.query && filter.query.match) {
      return courier
      .indexPatterns
      .get(filter.meta.index).then(function (indexPattern) {
        key = (filter.query.nested ? _.keys(filter.query.nested.query.match)[0] : _.keys(filter.query.match)[0]);
        field = indexPattern.fields.byName[key];
        value = (filter.query.nested ? filter.query.nested.query.match[key].query : filter.query.match[key].query);
        value = field.format.convert(value);
        return { key: key, value: value };
      });
    }
    return Promise.reject(filter);
  };
};
