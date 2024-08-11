import { arch } from 'node:process';
import { execSync } from 'node:child_process';

if (['arm', 'arm64'].includes(arch)) {
	execSync('npm install array-gpio', [0, 1, 2]);
}