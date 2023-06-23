export default {
	clearPicker_orders: async () => {
		await resetWidget("FilePicker1");
		storeValue('newList',undefined);
	},

	synchronize: async () => {
		await	get_user.run();
		await	get_user_department.run();
	  
		//await	get_invoicelist.run();
		
	},
	autorefresh: async () => {
		setInterval(() => {get_draftorders.run()
				 }, 3000, "autoupdate");
/*get_invoicelist_count.run()*/
	},
	getDraftOrdersForEmail: async() => {
		//get the information needed for the draft orders,
		const orderInfo = await get_draftorders.run();
		console.log("JG orderInfo", orderInfo);
		
		for (const i in orderInfo){
			const progress = (i/orderInfo.length) * 100;
			storeValue('tableProgress', progress);
			const lineItems = await get_order_pricing_info.run({itemID: orderInfo[i].Id});
			console.log("JG Info", lineItems);
			let quantity = 0;
			let mailPrice = 0;
			let extraSheetPrice = 0;
			let extraSheetQty = 0;
			const rates = [];
			
			lineItems.forEach(lineItem => {
				if(lineItem.SubItemID === null){
					mailPrice = lineItem.Rate;
					quantity = lineItem.Qty;
				} else if(lineItem.InitialProdDescription.includes('Extra') || lineItem.InitialProdDescription.includes('add') ){
					extraSheetPrice = lineItem.Rate;
					extraSheetQty = lineItem.Qty;
				} else {
					rates.push(lineItem.Rate);
				}
			});
			console.log("JG somein", quantity, mailPrice, extraSheetPrice, extraSheetQty, rates);
			let serviceString = '';
			rates.forEach(rate => {
				if(rate !== 0){
					serviceString += ` + ${rate}`;
				}
			});
			
			const calculation = `${quantity} * (${mailPrice}${extraSheetQty !== 0 ? ` + (${extraSheetPrice} * ${extraSheetQty / quantity})` : ''}
				${serviceString}) = ${orderInfo[i].Subtotal}`;
			
			orderInfo[i].result = calculation;
		}
		
		console.log("JG Updated", orderInfo)
		storeValue('emailDraft',orderInfo);
		storeValue('tableProgress', 100);
	}

}