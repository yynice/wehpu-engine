var cheerio = require('cheerio');
var async = require('async');
var config = require('./config');
var logger = require('../../common/logger');
var request = require('superagent');
require('superagent-charset')(request);

/**
 * 获取urls
 * @return {Promise} urls 结果数组
 */
function getUrls(flag) {
  // Promise
  return new Promise((resolve, reject) => {
    // URLs
    var urls = [];

    // 发起请求
    request
      .get(config.url)
      .set(config.headers)
      .charset('gbk')
      .then(res => {
        $ = cheerio.load(res.text, config.cheerioConfig);
        // 匹配URLs
        $('a').filter((i, elem) => {
          return $(elem).attr('href').search('http://news.hpu.edu.cn/news/contents/') !== -1;
        }).each((i, elem) => {
          // 并入数组
          urls.push($(elem).attr('href'));
        });
        // 返回结果数组
        if (urls.length > 0) {
          // 截取未抓取过的urls
          var _urls = urls.slice(0, urls.findIndex(i => i === flag));
          resolve(_urls);
        } else {
          reject('匹配URLs出错');
        }
      })
      .catch(err => {
        // consol.log(err);
        logger.error('匹配新闻网URLs出错:' + err);
        reject('匹配URLs出错');
      });
  });
}

/**
 * 获取文章详情
 * @param {Object} classify 分类URLs
 * @return {Promise} Promise
 */
function getContent(urls) {
  // Promise
  return new Promise((resolve, reject) => {
    // News
    var news = [];

    async.eachLimit(urls, config.limit, (url, cb) => {
      // console.log(url);

      // 发起请求
      request
        .get(url)
        .charset('gbk')
        .then(res => {
          $ = cheerio.load(res.text, config.cheerioConfig);
          var mainTd = $('td', '#body').attr('width', '700');

          var _news = {
            // 标题
            title: $('.NewsTitle', mainTd).text().trim(),
            // 内容
            content: $('#NewsContent', mainTd).html(),
            // 来源作者
            author: $('tr', mainTd).eq(2).text().search(/供稿人.(.+)发布/) !== -1 ? $('tr', mainTd).eq(2).text().match(/供稿人.(.+)发布/)[1].trim() : '',
            // 时间
            time: $('tr', mainTd).eq(2).text().search(/\d{4}(-)\d{2}\1\d{2}/) !== -1 ? $('tr', mainTd).eq(2).text().match(
              /\d{4}(-)\d{2}\1\d{2}/)[0] : ''
          }

          // 并入结果数组
          news.push(_news);

          // 执行回调
          cb(null);
        })
        .catch(err => {
          // console.log(err);
          logger.error('匹配新闻内容:' + err);
        });
    }, err => {
      if (news.length > 0) {
        // 返回抓取结果以及第一条URL
        resolve([news, urls[0]]);
      } else {
        reject('匹配新闻内容出错');
      }
    });
  });
}

exports.getNews = function () {
  // 获取上次匹配进度Flag
  var flag = 'http://news.hpu.edu.cn/news/contents/544/121223.html';
  // 获取urls
  Promise.resolve(getUrls(flag))
    // 获取内容
    .then(urls => {
      console.log('开始获取内容');

      return Promise.resolve(getContent(urls));
    })
    // 解构新闻内容以及本次匹配进度
    .then(([newsRes, url]) => {
      console.log(newsRes);
      console.log(url);
    })
    .catch(err => {
      // console.log(err);
      logger.error('新闻网内容抓取失败:' + err);
    });
}