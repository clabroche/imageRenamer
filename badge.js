const fs = require('fs')
var lcov2badge = require("lcov2badge");
lcov2badge.badge({
    filePath: "./docs/lcov.info",
    subject: 'cover'					// default is 'coverage'
}, function(err, svgBadge) {
  if (err) throw err;
  fs.writeFileSync('./badge.svg', svgBadge, 'utf-8')
});
