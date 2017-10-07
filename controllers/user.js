var User = require('../models/user');

/**
 * 单用户查询
 * @method GET
 * @param {String} [openId] 包含在token中的openId
 */
exports.user = function (req, res, next) {
  var openId = req.jwtPayload.openId;

  if (!openId) {
    res.status(400).json({
      statusCode: 400,
      errMsg: '请求格式错误！'
    })
  }

  // 查询用户
  User.findOne({
    openId: openId
  })
    .then(person => {
      if(person) {
        var userInfo = {
          nickName: person.nickName,
          studentId: person.studentId,
          name: person.name,
          bind: person.bind
        }
        res.status(200).json({
          statusCode: 200,
          msg: '查询成功',
          data: userInfo
        });
      } else {
        res.status(404).json({
          statusCode: 404,
          errMsg: '用户不存在'
        });
      }
    })
    .catch(err => {
      res.status(500).json({
        statusCode: 500,
        errMsg: '用户不存在'
      });
    })
}