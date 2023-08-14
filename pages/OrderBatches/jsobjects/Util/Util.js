export default {
	orderSelected: async (renderedPDFS3Key) => {
		const data = await orderSignedURL.run({renderedPDFS3Key});
		navigateTo(data[0].signedUrl, {}, 'NEW_WINDOW');
	},
}