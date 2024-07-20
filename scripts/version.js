const fs = require('fs');
const path = require('path');

// 获取命令行参数
const [,, updateType] = process.argv;

if (!['major', 'minor', 'patch'].includes(updateType)) {
    console.error('Invalid argument. Please use "major"、 "minor" or "patch".');
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
                const versionParts = packageJson.version.split('.').map(Number);

                if (updateType === 'major') {
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
