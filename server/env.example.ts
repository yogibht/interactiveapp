interface ISSL {
	enabled: boolean;
	keyfile: string;
	certfile: string;
}

interface IENV {
	isDev: boolean;
	SSL: ISSL;
	serviceport: number;
	clusterenabled?: boolean;
}

const ENV: IENV = {
	isDev: true,
	SSL: {
		enabled: false,
		keyfile: "",
		certfile: ""
	},
	serviceport: 80
};

export {
	IENV,
	ENV
};
