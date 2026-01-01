const DEPLOYMENT_REGEX = /https:\/\/(.+).convex.cloud/;

export function missingEnvVariableUrl(envVarName: string, whereToGet: string) {
	const deployment = deploymentName();
	if (!deployment) {
		return `Missing ${envVarName} in environment variables.`;
	}
	return (
		`\n  Missing ${envVarName} in environment variables.\n\n` +
		`  Get it from ${whereToGet} .\n  Paste it on the Convex dashboard:\n` +
		`  https://dashboard.convex.dev/d/${deployment}/settings?var=${envVarName}`
	);
}

export function deploymentName() {
	const url = process.env.CONVEX_CLOUD_URL;
	if (!url) {
		return undefined;
	}
	return DEPLOYMENT_REGEX.exec(url)?.[1];
}
