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
		await get_printer_currency.run();

		const printerCurrency = get_printer_currency.data;
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
			
			let sla;
			if(printerItem[0].DeliveryDate == null){
				sla = 'N/A';
			} else {
				const sendDate = moment(printerItem[0].InvoiceDate, 'YYYY-MM-DD');
				const deliverDate = moment(printerItem[0].DeliveryDate, 'YYYY-MM-DD');
				sla = deliverDate.diff(sendDate, 'days');
			}

			const orderInfo = {
				Id: value[0].Id,
				CustomerName: value[0].CustomerName,
				InvoiceID: value[0].InvoiceID,
				CustomerPriceID: value[0].CustomerPriceID,
				Qty: value[0].Qty,
				Printer: value[0].Printer,
				OrderStatus: value[0].OrderStatus,
				SLA: sla,
				Notes: value[0].Notes,
				Destination: value[0].Destination,
				InvoiceDate: value[0].InvoiceDate,
				PaymentMethod: value[0].PaymentMethod,
				InvoiceStatus: value[0].InvoiceStatus,
				InvoiceOrderStatus: value[0].InvoiceOrderStatus,
				OrderDetails: customerInfo.productDescription,
				CustomerCurrency: value[0].Currency,
				CustomerCalculation: customerInfo.calculation,
				Summary: customerInfo.totalAmount,
				PrinterCurrency: printerItem[0].Printer !== null ? printerCurrency.find(printer => printer.PrinterName === printerItem[0].Printer).Currency : 'N/A',
				PrinterCalculation: printerInfo.calculation,
				PrinterSummary: printerInfo.totalAmount
			}

			combinedData.push(orderInfo);

		}

		await storeValue('logSummary',combinedData);
		await storeValue('logSumTableProgress', '');
		showAlert('Order date updated!', 'success');
	},
	updateSingleItem: async (orderID, orderStatus, invoiceID, invoiceStatus) => {
		await update_single_order_status.run({type: 'PrinterLineItems', orderID, orderStatus});
		await update_single_order_status.run({type: 'CustomerLineItems', orderID, orderStatus});
		await update_single_invoice_status.run({invoiceID, invoiceStatus});
		
		if(orderStatus === 'DELIVERED'){
			await update_single_delivery_date.run({orderID});
		}
		
		await StoreActions.rundateoforder();
	},
	updateAllOrderStatus: async () => {
		if(AllOrdersStatus_Select.selectedOptionValue !== ""){
			const orderIDs = [];
			for(const item of appsmith.store.logSummary){
				orderIDs.push(item.Id)
			}
			const orderStatus = AllOrdersStatus_Select.selectedOptionValue;
			await update_multiple_order_status.run({type: 'PrinterLineItems', orderIDs, orderStatus});
			await update_multiple_order_status.run({type: 'CustomerLineItems', orderIDs, orderStatus});
			if(orderStatus === 'DELIVERED'){
			await update_single_delivery_date.run({orderIDs});
			}
			await StoreActions.rundateoforder();
		}
	},
	updateAllInvoiceStatus: async () => {
		if(AllInvoiceStatus_Select.selectedOptionValue !== ""){
			const invoices = [];
			for(const item of appsmith.store.logSummary){
				invoices.push(item.InvoiceID)
			}
			const invoiceStatus = AllInvoiceStatus_Select.selectedOptionValue;
			await update_multiple_invoice_status.run({invoices, invoiceStatus});
			await StoreActions.rundateoforder();
		}
	},
}
