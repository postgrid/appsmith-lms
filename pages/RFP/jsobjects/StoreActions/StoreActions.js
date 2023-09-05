export default {
showAllRFP: async () => {
await get_RFP_T1.run();
await get_RFP_T2.run();
await get_RFP_T3.run();
await get_RFP_T4.run();
await get_RFP_T5.run();
	let combinedData = get_RFP_T1.data.map((item) => {
   	const tier2 = get_RFP_T2.data.find((item2) => item.ProductDescription == item2.ProductDescription) || {};
	const tier3 = get_RFP_T3.data.find((item3) => item.ProductDescription == item3.ProductDescription) || {};
	const tier4 = get_RFP_T4.data.find((item4) => item.ProductDescription == item4.ProductDescription) || {};
	const tier5 = get_RFP_T5.data.find((item5) => item.ProductDescription == item5.ProductDescription) || {};
   		return { ...item, ...tier2 , ...tier3, ...tier4 , ...tier5 };
		})	
storeValue('showAllTier', combinedData);
	}
}
