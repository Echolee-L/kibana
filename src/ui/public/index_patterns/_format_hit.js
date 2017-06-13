import _ from 'lodash';
// Takes a hit, merges it with any stored/scripted fields, and with the metaFields
// returns a formated version

export default function (indexPattern, defaultFormat) {

  function convert(hit, val, fieldName, recurse) {
    let field = indexPattern.fields.byName[fieldName];
    if (!field) {
      if (val.constructor === Array && recurse) {
        let pArr = [];
        _.forEach(val, function (item) {
          let pStore = {};
          _.forEach(item, function (val, fieldName) {
            pStore[fieldName] = convert(hit, val, fieldName, true);
          });
          pArr.push(pStore);
        });
        return pArr;
      } else {
        return defaultFormat.convert(val, 'html');
      }
    }
    return field.format.getConverterFor('html')(val, field, hit);
  }

  function formatHit(hit) {
    if (hit.$$_formatted) return hit.$$_formatted;

    // use and update the partial cache, but don't rewrite it. _source is stored in partials
    // but not $$_formatted
    let partials = hit.$$_partialFormatted || (hit.$$_partialFormatted = {});
    let cache = hit.$$_formatted = {};
    let tableFormatted = {};

    _.forOwn(indexPattern.flattenHit(hit), function (val, fieldName) {
      // sync the formatted and partial cache
      new Promise(function (resolve, reject) {
        let formatted = partials[fieldName] == null ? convert(hit, val, fieldName, true) : partials[fieldName];
        cache[fieldName] = partials[fieldName] = formatted;
      });
      tableFormatted[fieldName] = convert(hit, val, fieldName, false);
    });

    return tableFormatted;
  }

  formatHit.formatField = function (hit, fieldName) {
    let partials = hit.$$_partialFormatted;
    if (partials && partials[fieldName] != null) {
      return partials[fieldName];
    }

    if (!partials) {
      partials = hit.$$_partialFormatted = {};
    }

    let val = fieldName === '_source' ? hit._source : indexPattern.flattenHit(hit)[fieldName];
    return partials[fieldName] = convert(hit, val, fieldName, false);
  };

  formatHit.convertField = function (hit, val, fieldName) {
    return convert(hit, val, fieldName, false);
  };

  return formatHit;
};

