const fs = require('fs');
const path = require('path');

// 获取命令行参数
const [,, updateType, tagType] = process.argv;

if (!['major', 'minor', 'patch', 'prod', 'beta'].includes(updateType)) {
    console.error('Invalid argument. Please use "major"、 "minor"、 "patch"、 "prod" or "beta".');
    process.exit(1);
}

// 获取 packages 目录路径
const packagesDir = path.join(__dirname, '../packages');

// 读取 packages 目录下的所有文件夹
fs.readdir(packagesDir, (err, files) => {
    if (err) {
        console.error('Error reading packages directory:', err);
        process.exit(1);
    }

    files.forEach(file => {
        const packageJsonPath = path.join(packagesDir, file, 'package.json');

        // 读取 package.json 文件
        fs.readFile(packageJsonPath, 'utf8', (err, data) => {
            if (err) {
                console.error(`Error reading ${packageJsonPath}:`, err);
                return;
            }

            try {
                const packageJson = JSON.parse(data);
                const [version, tagParts] = packageJson.version.split('-'); // 兼容 x.x.x-beta.x
                const versionParts = version.split('.').map(Number);

                let [tagName, tagVersion] = (tagParts || 'beta.0').split('.');

                if (updateType === 'prod') {
                    // 删除 tag
                } else if (updateType === 'beta') {
                    // 仅升级 tag 版本
                    tagVersion = (Number(tagVersion) + 1);
                } else if (updateType === 'major') {
                    versionParts[0] += 1;
                    versionParts[1] = 0;
                    versionParts[2] = 0;
                } else if (updateType === 'minor') {
                    versionParts[1] += 1;
                    versionParts[2] = 0;
                } else if (updateType === 'patch') {
                    versionParts[2] += 1;
                }

                packageJson.version = versionParts.join('.');

                if (tagType || updateType === 'beta') {
                    packageJson.version = `${packageJson.version}-${tagType || tagName}.${tagVersion}`;
                }

                // 写回更新后的 package.json 文件
                fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8', err => {
                    if (err) {
                        console.error(`Error writing ${packageJsonPath}:`, err);
                    } else {
                        console.log(`Updated ${packageJson.name} to version ${packageJson.version}`);
                    }
                });
            } catch (err) {
                console.error(`Error parsing ${packageJsonPath}:`, err);
            }
        });
    });
});
