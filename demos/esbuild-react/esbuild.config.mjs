import fs from 'fs';
import path from 'path';
import * as esbuild from 'esbuild';
import { codeInspectorPlugin } from 'code-inspector-plugin'

const args = process.argv;
console.log('Args', args);

const PUBLIC_DIRECTORY = 'public';
const SOURCE_DIRECTORY = 'src';
const BUILD_DIRECTORY = 'dist';

const INDEX_FILE = 'index.tsx';
const OUTPUT_FILE = 'output.js';

const getArgument = (name) => {
	const index = process.argv.indexOf(`--${name}`);
	if (index === -1) {
		return undefined;
	}

	return process.argv[index + 1];
};

const emptyDirectory = async (directoryPath) => {
	const files = await fs.promises.readdir(directoryPath);

	for (const file of files) {
		const filePath = path.join(directoryPath, file);
		const stat = await fs.promises.stat(filePath);

		if (stat.isDirectory()) {
			await emptyDirectory(filePath);
			await fs.promises.rmdir(filePath);
		} else {
			await fs.promises.unlink(filePath);
		}
	}
};

const copyPublicPlugin = {
	name: 'copy-public',
	setup(build) {
		build.onEnd(() =>
			fs.cpSync(PUBLIC_DIRECTORY, BUILD_DIRECTORY, {
				dereference: true,
				errorOnExist: false,
				force: true,
				preserveTimestamps: true,
				recursive: true,
			}),
		);
	},
};

const start = async (port) => {
	const ctx = await esbuild.context({
		logLevel: 'debug',
		entryPoints: [`${SOURCE_DIRECTORY}/${INDEX_FILE}`],
		outfile: `${BUILD_DIRECTORY}/${OUTPUT_FILE}`,
		format: 'cjs',
		bundle: true,
		minify: false,
		sourcemap: true,
		plugins: [codeInspectorPlugin({ bundler: 'esbuild', dev: true }), copyPublicPlugin],
		define: {
			LIVE_RELOAD: 'true',
		},
	});

	await ctx.watch();

	await ctx.serve({
		servedir: BUILD_DIRECTORY,
		port: port,
		onRequest: handleRequest,
	});
};

const handleRequest = ({ remoteAddress, method, path, status, timeInMS }) => {
	const WHITE_COLOR = '\x1b[0m';
	const RED_COLOR = '\x1b[31m';
	const GREEN_COLOR = '\x1b[32m';
	const CYAN_COLOR = '\x1b[36m';
	const BASE_COLOR = WHITE_COLOR;

	const methodColor = CYAN_COLOR;
	const statusColor = status >= 400 ? RED_COLOR : GREEN_COLOR;

	console.info(
		`${remoteAddress} ${methodColor}${method}${BASE_COLOR} ${path} ${statusColor}${status}${BASE_COLOR} [${timeInMS}ms]`,
	);
};

const build = async () => {
	await esbuild.build({
		logLevel: 'info',
		entryPoints: [`${SOURCE_DIRECTORY}/${INDEX_FILE}`],
		outfile: `${BUILD_DIRECTORY}/${OUTPUT_FILE}`,
		format: 'cjs',
		bundle: true,
		minify: true,
		sourcemap: true,
		plugins: [copyPublicPlugin],
		define: {
			LIVE_RELOAD: 'false',
		},
	});
};

const clean = async () => {
	try {
		await emptyDirectory(BUILD_DIRECTORY);
		console.log(`Build directory ${BUILD_DIRECTORY} has been cleaned`);
	} catch (error) {
		console.error(`Error cleaning build directory ${BUILD_DIRECTORY}:`, error);
	}
};

if (args.includes('--start')) {
	const port = Number(getArgument('port')) || undefined;
	await start(port);
}

if (args.includes('--build')) {
	await build();
}

if (args.includes('--clean')) {
	await clean();
}
