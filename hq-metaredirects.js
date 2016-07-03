var hq = require('hyperquext');
var url = require('url');
var parseMetaRefresh = require('http-equiv-refresh');
var attachCheerioToResponse = require('hyperquext-cheerio'),
  redirector = hq.devcorators.redirector,
  consumeForcedOption = hq.devcorators.consumeForcedOption,
  getFinalRequestFromHyperquext = hq.helpers.getFinalRequestFromHyperquext,
  getResponseFromClientRequest = hq.helpers.getResponseFromClientRequest;

module.exports = function hyperquextMeDirect(hyperquext) {
  return redirector(function (uri, opts, cb) {
    if (!opts.maxRedirects) return opts;

    var req = consumeForcedOption(attachCheerioToResponse(hyperquext), 'cheerio')(uri, opts, cb);

    getFinalRequestFromHyperquext(req, function (err, finalRequest) {
      getResponseFromClientRequest(finalRequest, function (err, res) {
        if (res['$redirect'] || !res.cheerio) return;
        var $ = res.cheerio;
        var redirectUrl;
        $('meta[http-equiv]').each( function () {
          var el = $(this);
          if (el.attr('http-equiv').toLowerCase() !== 'refresh') {
            return;
          }
          redirectUrl = parseMetaRefresh(el.attr('content')).url;
        })

        if (redirectUrl) {
          finalRequest.res['$redirect'] = {
            statusCode: 'meta-refresh',
            redirectUri: url.resolve(req.reqopts.uri, redirectUrl)
          }
        }
      })
    })

    return req;
  });
}
