export default {

	rundateoforder: async () => {
		const generateOrderLineMap = (lineItems) => {
			const lineItemMap = [];
			let currentMain = [];
			let firstRun = true;
			for(const lineItem of lineItems){
				if(lineItem.SubItemID === null){
					if(firstRun){
						currentMain = [lineItem];
						firstRun = false;
					}else if(currentMain.length > 0){
						lineItemMap.push(currentMain);
						currentMain = [lineItem];
					}		
				} else {
					if(currentMain[0].Id == lineItem.SubItemID){
						currentMain.push(lineItem)
					}
				}
			}
			return lineItemMap;
		};
		const getCalcAndDescription = (lineItems, type) => {
			let totalAmount = 0;
			let quantity = 0;
			let mailPrice = 0;
			let extraSheetPrice = 0;
			let extraSheetQty = 0;
			const rates = [];
			let sheets = 0;

			let productDescription = ''
			for(const lineItem of lineItems){
				totalAmount += lineItem.Amount;
				if(type == 'customer'){
					if(lineItem.SubItemID === null){
						mailPrice = lineItem.Rate;
						quantity = lineItem.Qty;
						sheets = lineItem.Sheets;
						productDescription = lineItem.ProductDescription;
					} else {
						if(lineItem.ProductDescription.includes('Extra') || lineItem.ProductDescription.includes('add')){
							productDescription += ` ➤ (${sheets}) ${lineItem.ProductDescription}`
							extraSheetPrice = lineItem.Rate;
							extraSheetQty = lineItem.Qty;
						} else {
							if(!lineItem.ProductDescription.includes('Envelope')){
								rates.push(lineItem.Rate ?? null);
							}
							productDescription += ` ➤ ${lineItem.ProductDescription}`
						}
					}
				} else {
					if(lineItem.SubItemID === null){
						mailPrice = lineItem.Rate;
						quantity = lineItem.Qty;
					} else {
						if(lineItem.InitialProdDescription.includes('Extra') || lineItem.InitialProdDescription.includes('add')){
							extraSheetPrice = lineItem.Rate;
							extraSheetQty = lineItem.Qty;
						} else {
							if(!lineItem.InitialProdDescription.includes('Envelope')){
								rates.push(lineItem.Rate ?? null);
							}
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
				${serviceString}) = ${totalAmount}`;

			if(type == 'customer'){
				return {
					productDescription,
					calculation,
					totalAmount
				}
			} else {
				return {
					calculation,
					totalAmount
				}
			}

		};

		//verify that the start date is greater then the end date
		if(moment(StartDate_Picker.selectedDate).isAfter(EndDate_Picker.selectedDate)){
			await showAlert("Start Date must come before End Date", "error");
			return;
		}

		const delimiterIndex = Organization_select.selectedOptionLabel.indexOf(' - ');
		const selectedOrg = Organization_select.selectedOptionLabel.slice(0, delimiterIndex);

		await storeValue('logSumTableProgress', 'loading...');

		await get_customer_price_info.run();
		await get_allorder_printcost.run();

		const combinedData = [];
		const customerLineItems = generateOrderLineMap(
			Organization_select.selectedOptionValue !== "all" && Organization_select.selectedOptionValue !== "" ? 
			get_customer_price_info.data.filter(item => item.CustomerName === selectedOrg) 
			: get_customer_price_info.data);
		const printerLineItems = generateOrderLineMap(get_allorder_printcost.data);

		for (const value of customerLineItems) {
			const printerItem = printerLineItems.find(printerItem => printerItem[0].Id == value[0].Id);
			const customerInfo = getCalcAndDescription(value, "customer")
			const printerInfo = getCalcAndDescription(printerItem, "printer")

			const orderInfo = {
				Id: value[0].Id,
				CustomerName: value[0].CustomerName,
				InvoiceID: value[0].InvoiceId,
				CustomerPriceID: value[0].CustomerPriceID,
				Qty: value[0].Qty,
				Printer: value[0].Printer,
				OrderStatus: value[0].OrderStatus,
				Notes: value[0].Notes,
				Destination: value[0].Destination,
				InvoiceDate: value[0].InvoiceDate,
				PaymentMethod: value[0].PaymentMethod,
				InvoiceStatus: value[0].InvoiceStatus,
				InvoiceOrderStatus: value[0].InvoiceOrderStatus,
				OrderDetails: customerInfo.productDescription,
				CustomerCalculation: customerInfo.calculation,
				Summary: customerInfo.totalAmount,
				PrinterCalculation: printerInfo.calculation,
				PrinterSummary: printerInfo.totalAmount
			}

			combinedData.push(orderInfo);

		}

		await storeValue('logSummary',combinedData);
		await storeValue('logSumTableProgress', '');
		showAlert('Order date updated!', 'success');
	},
}
