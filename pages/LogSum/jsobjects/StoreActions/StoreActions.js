export default {

	rundateoforder: async () => {
		const buildCalculation = (lineItems, subTotal) => {
			let quantity = 0;
			let mailPrice = 0;
			let extraSheetPrice = 0;
			let extraSheetQty = 0;
			const rates = [];
			// console.log("JG lineItems", lineItems)

			for(const lineItem of lineItems){
				if(lineItem.rate === null){
					return "";
				}
				if(lineItem.SubItemID === null){
					mailPrice = lineItem.Rate;
					quantity = lineItem.Qty;
				} else if(lineItem.InitialProdDescription){
					if(lineItem.InitialProdDescription.includes('Extra') || lineItem.InitialProdDescription.includes('add')){
						extraSheetPrice = lineItem.Rate;
						extraSheetQty = lineItem.Qty;
					} else {
						rates.push(lineItem.Rate);
					}
				} else if(lineItem.ProductDescription ){
					if(lineItem.ProductDescription.includes('Extra') || lineItem.ProductDescription.includes('add')){
						extraSheetPrice = lineItem.Rate;
						extraSheetQty = lineItem.Qty;
					} else {
						rates.push(lineItem.Rate);
					}
				}
			}

			let serviceString = '';
			rates.forEach(rate => {
				if(rate !== 0){
					serviceString += ` + ${rate}`;
				}
			});

			const calculation = `${quantity} * (${mailPrice}${extraSheetQty !== 0 ? ` + (${extraSheetPrice} * ${extraSheetQty / quantity})` : ''}
				${serviceString}) = ${subTotal}`;

			return calculation;
		};

		await get_invoicelist.run(()=>{
			get_allorders_invoice.run(),
				get_allorder_items.run(),
				get_allorder_printcost.run(),
				get_customer_price_info.run(),
				get_printer_price_info.run(),
				showAlert('Order date updated!', 'success')
		}, () => {});
		const combinedData = [];
		await storeValue('logSumTableProgress', 'loading...');
		console.log("JG get_customer_price_info", get_customer_price_info.data)
		for(const item of Object.entries(get_allorders_invoice.data)){
			const tier2 = get_allorder_items.data.find((item2) => item.Id == item2.Id) || {};
			const customerLineItems = get_customer_price_info.data.filter(order => order.Id === item.Id || order.SubItemID === item.Id)

			const calcCustomer = buildCalculation(customerLineItems, tier2.Summary);
			const tier3 = get_allorder_printcost.data.find((item3) => item.Id == item3.Id) || {};
			const printerLineItems = await get_printer_price_info.data.filter(order => order.Id === item.Id || order.SubItemID === item.Id);
			const calcPrinter = !tier3 || JSON.stringify(tier3) === '{}'  ? '' : buildCalculation(printerLineItems, tier3.PSummary);
			// console.log("JG", item, tier2, tier3, calcCustomer, calcPrinter)
			combinedData.push({ ...item, ...tier2 ,...tier3, calcCustomer, calcPrinter});
		}
		console.log("JG combined", combinedData)

		await storeValue('logSummary',combinedData);
		await storeValue('logSumTableProgress', '');
	},
}
