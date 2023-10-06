export default {
	clearPicker_orders: async () => {
		await resetWidget("FilePicker1");
		storeValue('newList',undefined);
	},

	synchronize: async () => {
		await	get_user.run();
		await	get_user_department.run();
	  await get_draftorders.run();
		//await	get_invoicelist.run();
		
	},
	getDraftOrdersForEmail: async() => {
		const generateOrderLineMap = (lineItems) => {
			console.log("JG ")
			const organizedItemMap = new Map();
			const mainItems = lineItems.filter(item => item.SubItemID === null);
			for(const mainItem of mainItems){
				let items = [];
				items.push(mainItem);
				const subItems = lineItems.filter(item => item.SubItemID === mainItem.Id);
				if(subItems.length > 0){
					items = items.concat(subItems);
				}
				const mapItem = organizedItemMap.get(mainItem.ClientName)
				if(mapItem){
					organizedItemMap.set(mainItem.ClientName, {
						items: mapItem.items.concat(items),
						qty: mapItem.qty += items[0].Qty
					})
				} else {
					organizedItemMap.set(mainItem.ClientName, {
						items: [items],
						qty: items[0].Qty
					})
				}
			}
			
			console.log("JG organizedItemMap")
			return organizedItemMap;

		};
		const getCalcAndDescription = (lineItems) => {
			let totalAmount = 0;
			let quantity = 0;
			let mailPrice = 0;
			let extraSheetPrice = 0;
			let extraSheetQty = 0;
			const rates = [];
			let destination = '';
			let collateral = '';

			let productDescription = ''
			for(const lineItem of lineItems){
				totalAmount += lineItem.Amount;
				if(lineItem.SubItemID === null){
					mailPrice = lineItem.Rate;
					quantity = lineItem.Qty;
					destination = lineItem.Destination;
					
					collateral = lineItem.ProductDescription;
					productDescription = `${lineItem.Qty} ${lineItem.ProductDescription}`;
				} else {
					if(lineItem.ProductDescription.includes('Extra') || lineItem.ProductDescription.includes('add')){
						extraSheetPrice = lineItem.Rate;
						extraSheetQty = lineItem.Qty;
						productDescription += ` ➤ (${lineItem.Qty}) ${lineItem.ProductDescription}`
					} else {
						if(!lineItem.ProductDescription.includes('Envelope')){
							rates.push(lineItem.Rate ?? null);
						}
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
				${serviceString}) = ${totalAmount.toFixed(2)}`;
			
			return {
				collateral,
				destination,
				productDescription,
				calculation,
				totalAmount
			}

		};

		await storeValue(
			'emailDraftInfo', 
			{
				date: DatePicker1.selectedDate,
				printer: Select3.selectedOptionLabel
			}
		)

		// await get_customer_price_info.run();
		await get_allorder_printcost.run();
		// await get_printer_currency.run();

		// const printerCurrency = get_printer_currency.data;
		// const combinedData = [];
		// const filteredCustomerItems = (() => {
			// let items = get_customer_price_info.data;
			// if(Organization_select.selectedOptionValue !== "all"){
				// items = items.filter(item => item.CustomerName === selectedOrg)
			// }
// 
			// if(Printer_select.selectedOptionValue !== 'All'){
				// items = items.filter(item => item.Printer === Printer_select.selectedOptionValue)
			// }
			// return items;
		// })()

		// const customerLineItems = generateOrderLineMap(filteredCustomerItems);
		const printerLineItems = generateOrderLineMap(get_allorder_printcost.data);
		
		const combinedData = [];
		
		console.log("JG printer", printerLineItems)

		for (let [key, value] of printerLineItems) {
			let number = 0;
			for(const [index,items] of value.items){
				const printerInfo = getCalcAndDescription(items)

				let orderInfo;
				
				if(index === 0){
					number++;
					orderInfo = {
						Num: number,
						orderCounts: value.qty,
						collateral: printerInfo.collateral,
						clients: key,
						to: printerInfo.destination,
						orderDetails: printerInfo.productDescription,
						calculation: printerInfo.calculation,
						subtotal: printerInfo.totalAmount,
						id: items[0].id
					}
				} else {
					orderInfo = {
						Num: '',
						orderCounts: '',
						collateral: printerInfo.collateral,
						clients: key,
						to: printerInfo.destination,
						orderDetails: printerInfo.productDescription,
						calculation: printerInfo.calculation,
						subtotal: printerInfo.totalAmount,
						id: items[0].id
					}
				}
				combinedData.push(orderInfo);
			}

		}
		await storeValue('emailDraft',combinedData);
		showAlert('Order date updated!', 'success');
		
		//OLD----------
		//get the information needed for the draft orders,
		// const orderInfo = await get_draftorders.run();
		// storeValue('emailDraft',orderInfo);
	}

}