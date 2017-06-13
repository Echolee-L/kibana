import moment from 'moment';
import buildRangeFilter from 'ui/filter_manager/lib/range';
export default function createDateHistogramFilterProvider(Private) {

  return function (agg, key) {
    let start = moment(key);
    let interval = agg.buckets.getInterval();

    let filter = buildRangeFilter(agg.params.field, {
      gte: start.valueOf(),
      lt: start.add(interval).valueOf(),
      format: 'epoch_millis'
    }, agg.vis.indexPattern);
    if (agg.params.nested) {
      filter = { 'nested' : { 'query' : { 'bool' : { 'must' : [{filter}]}}, 'path' : agg.params.nested.path}};
    }
    return filter;
  };

};
