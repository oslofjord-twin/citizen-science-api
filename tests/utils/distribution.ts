const createPairs = (members: number[]): number[][] => {
	const pairs = [];
	const n = members.length;
	for (let i = 0; i < n; i++) {
		for (let j = 0; j < n; j++) {
			pairs.push([members[i], members[j]]);
		}
	}

	return pairs;
};

const calculateTotalGap = (pairs: number[][]) => {
	const gapValues = pairs.map(([first, second]) => {
		return Math.abs(first - second);
	});
	const totalGapSum = gapValues.reduce((acc, val) => acc + val, 0);
	return totalGapSum;
};

export const calculateGini = (members: number[]) => {
	const n = members.length;
	const total = members.reduce((acc, val) => acc + val, 0);
	const pairs = createPairs(members);
	const gapSum = calculateTotalGap(pairs);
	const gini = gapSum / (2 * n * total);
	return gini;
};

export const calculateGiniNorm = (members: number[]) => {
	const n = members.length;
	if (n < 2) return 0;
	const mean = members.reduce((acc, val) => acc + val, 0) / n;
	if (mean === 0) return 0;

	const sortedMembers = [...members].sort((a, b) => b - a);
	const weightedSum = sortedMembers.reduce((acc, val, index) => acc + (index + 1) * val, 0); // poorest most weighted
	const giniNorm = (n + 1) / (n - 1) - (2 / (n * (n - 1) * mean)) * weightedSum;
	return giniNorm;
};
