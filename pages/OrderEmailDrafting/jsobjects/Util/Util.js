export default {
	clearPicker_orders: async () => {
		await resetWidget("FilePicker1");
		storeValue('newList',undefined);
	},

	synchronize: async () => {
		await	get_user.run();
		await	get_user_department.run();
		await get_draftorders.run();
	},
	
	getDraftOrdersForEmail: async() => {
		const generateOrderLineMap = (lineItems) => {
			const organizedItemMap = [];
			const mainItems = lineItems.filter(item => item.SubItemID === null);
			for(const mainItem of mainItems){
				let items = [];
				items.push(mainItem);
				const subItems = lineItems.filter(item => item.SubItemID === mainItem.Id);
				if(subItems.length > 0){
					items = items.concat(subItems);
				}
				const mapItemIndex = organizedItemMap.findIndex(item => item.collateral === mainItem.ProductDescription)
				if(mapItemIndex !== -1){
					const item = organizedItemMap[mapItemIndex];
					organizedItemMap[mapItemIndex] = {
						collateral: item.collateral,
						qty: item.qty += items[0].Qty,
						items: [...item.items, items]
					}
				} else {
					organizedItemMap.push({
						collateral: mainItem.ProductDescription,
						qty: items[0].Qty,
						items: [items]
					})
				}
			}
			
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
						productDescription += ` ➤ (${lineItem.Qty/quantity}) ${lineItem.ProductDescription}`
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

		await get_allorder_printcost.run();

		const printerLineItems = generateOrderLineMap(get_allorder_printcost.data);

		const combinedData = [];

		let number = 0;
		for (let printerInfo of printerLineItems) {
			for(let index = 0; index < printerInfo.items.length; index++){
				const printerCalcDesc = getCalcAndDescription(printerInfo.items[index])

				let orderInfo;

				if(index === 0){
					number++;
					orderInfo = {
						'#': number,
						OrderCounts: printerInfo.qty,
						Collateral: printerCalcDesc.collateral,
						Clients: printerInfo.items[index][0].CustomerName,
						To: printerCalcDesc.destination,
						OrderDetails: printerCalcDesc.productDescription,
						Calculation: printerCalcDesc.calculation,
						Subtotal: printerCalcDesc.totalAmount.toFixed(2),
						id: printerInfo.items[index][0].id
					}
				} else {
					orderInfo = {
						'#': '',
						OrderCounts: '',
						Collateral: printerCalcDesc.collateral,
						Clients: printerInfo.items[index][0].CustomerName,
						To: printerCalcDesc.destination,
						OrderDetails: printerCalcDesc.productDescription,
						Calculation: printerCalcDesc.calculation,
						Subtotal: printerCalcDesc.totalAmount.toFixed(2),
						id:  printerInfo.items[index][0].id
					}
				}
				combinedData.push(orderInfo);
			}

		}
		await storeValue('emailDraft',combinedData);
		showAlert('Order date updated!', 'success');
	}

}