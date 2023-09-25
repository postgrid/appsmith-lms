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
		setInterval(() => {
				 }, 3000, "autoupdate");
/*get_invoicelist_count.run()*/
	},
	generateSolutionsLetterDetails: (lineItem) => {
		if(lineItem.ProductType === "Postcard"){
			return {
				color: "COLOR",
				mailClass: lineItem.ProductDescription.contains("First") ? "FC" : "SC",
				doubleSided: "SS",
				priceQuantity: lineItem.Qty,
				pieceQuantity: lineItem.Qty * 2
			}
		} else if (lineItem.ProductType === "Letter"){
			
		} else if (lineItem.ProductType === "Cheque"){
			
		} else {
			//selfmailer
		}
		return;
	},
	solutionsLogSumGeneration: async () => {
		const generateOrderLineMap = (lineItems) => {
			let lineItemMap = [];
			const mainItems = lineItems.filter(item => item.SubItemID === null);
			for(const mainItem of mainItems){
				let items = [];
				items.push(mainItem);
				const subItems = lineItems.filter(item => item.SubItemID === mainItem.Id);
				if(subItems.length > 0){
					items = items.concat(subItems);
				}

				lineItemMap.push(items);
			}
			return lineItemMap;

		};
		const getSolutionsInfo = (lineItems) => {
			let orderInfo = {
				jobDescription: "",
				jobName: "",
				mailClass: "FC",
				color: "BW",
				sameDay: "NO",
				doubleSided: "DS",
				pieceQuantity: 0,
				printQuantity: 0,
				baseCost: 0,
				additionalCost: "",
				oversize: 0,
				pages: 0,
				sheets: 0,
				certified: "",
				priority: "",
				sameDayCost: "",
				international: "",
				perforation: "",
				pieceTotalCost: 0,
				jobTotalCost: 0,
				clientExpense: 0,
				jobTotalCost2: 0
			}
			
			//jobDescription -- jobName -- client Expense -- jobTotalCost2
			
			//oversize -- piority -- 

			let productDescription = ''
			for(const lineItem of lineItems){
				orderInfo.jobTotalCost += lineItem.Amount;
				if(lineItem.SubItemID === null){
						const orderDetails = Util.generateSolutionsLetterDetails(lineItem);
						if(orderDetails){
							orderInfo.mailClass = orderDetails.mailClass;
							orderInfo.color = orderDetails.color;
							orderInfo.doubleSided = orderDetails.doubleSided;
							orderInfo.pieceQuantity = orderDetails.pieceQuantity;
							orderInfo.printQuantity = orderDetails.printQuantity;
							orderInfo.pages = orderDetails.pages;
							orderInfo.sheets = orderDetails.sheets;
						}
					
						orderInfo.baseCost = lineItem.Rate;
						orderInfo.pieceTotalCost += lineItem.Rate;
					
						
					} else {
						if(lineItem.ProductDescription.includes('Extra') || lineItem.ProductDescription.includes('add')){
							orderInfo.printQuantity *= lineItem.Qty
							orderInfo.pages = orderInfo.printQuantity / orderInfo.pieceQuantity;
							orderInfo.sheets = orderInfo.doubleSided === "SS" ? orderInfo.pages : (orderInfo.pages / 2) + (orderInfo.pages % 2)
						} else if(lineItem.ProductDescription === "SameDay"){
							orderInfo.sameDay = "YES";
							orderInfo.sameDayCost = lineItem.Rate;
							orderInfo.pieceTotalCost += lineItem.Rate;
						} else if(lineItem.ProductDescription.includes('Certified Mail')){
							orderInfo.certified = lineItem.Rate;
							orderInfo.pieceTotalCost += lineItem.Rate;
						} else if(lineItem.ProductDescription === "Internationl Delivery"){
							orderInfo.international = lineItem.Rate;
							orderInfo.pieceTotalCost += lineItem.Rate;
						} else if (lineItem.ProductDescription.includes("Oversized")){
							orderInfo.oversize = lineItem.Rate;
							orderInfo.pieceTotalCost += lineItem.Rate;
						} else if(lineItem.ProductDescription.includes("Perforated")){
							orderInfo.perforation = lineItem.Rate;
							orderInfo.pieceTotalCost += lineItem.Rate;
						}
						else {
							if(!lineItem.ProductDescription.includes('Envelope')){
								rates.push(lineItem.Rate ?? null);
							}
							productDescription += ` ➤ ${lineItem.ProductDescription}`
						}
					}
			}

			return orderInfo;
			
		};

		//verify that the start date is greater then the end date
		if(moment(StartDate_Picker_solutions.selectedDate).isAfter(EndDate_Picker_solutions.selectedDate)){
			await showAlert("Start Date must come before End Date", "error");
			return;
		}

		const delimiterIndex = Organization_select_solutions.selectedOptionLabel.indexOf(' - ');
		const selectedOrg = Organization_select_solutions.selectedOptionLabel.slice(0, delimiterIndex);

		await storeValue('solutionsLogSumTableProgress', 'loading...');

		await get_customer_price_info.run();
		await get_allorder_printcost.run();
		await get_printer_currency.run();

		const printerCurrency = get_printer_currency.data;
		const combinedData = [];
		const filteredCustomerItems = (() => {
			let items = get_customer_price_info.data;
			if(Organization_select.selectedOptionValue !== "all"){
				items = items.filter(item => item.CustomerName === selectedOrg)
			}

			if(Printer_select.selectedOptionValue !== 'All'){
				items = items.filter(item => item.Printer === Printer_select.selectedOptionValue)
			}
			return items;
		})()

		console.log("JG filteredCustomerItems", filteredCustomerItems)
		const customerLineItems = generateOrderLineMap(filteredCustomerItems);
		const printerLineItems = generateOrderLineMap(get_allorder_printcost.data);

		console.log("JG customerLineItems", customerLineItems)
		console.log("JG printerLineItems", printerLineItems)

		for (const value of customerLineItems) {
			const uuid = value[0].Id;
			console.log("JG uuid", uuid)
			const printerItem = printerLineItems.find(printerItems => printerItems.find(item => item.SubItemID === null).Id === uuid);
			console.log("JG printerItem", printerItem)
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
			
			const solutionsInfo = {
				Date: moment(value[0].InvoiceDate).format('DD-MMM'),
				'Client Name': value[0].CustomerName,
				'Job Description': "",
				'Job Name': "",
				SameDay: "",
				'Mail Class': "",
				'Ink Type': "",
				'Page Type': "",
				'Piece Quantity': "",
				'Print Quantity': "",
				'Base Cost': "",
				'Additional Cost': "",
				Oversize: "",
				'Per Pages': "",
				'Per Sheets': "",
				'Certified Mail': "",
				'Priority Mail': "",
				'SameDay Price': "",
				International: "",
				Perforation: "",
				'Piece Total Cost': "",
				'Job Total Cost': "",
				'PG Client Expense': "",
				'Job Total Cost 2': "",
				Notes: ""
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
				PrinterCurrency: printerItem[0].Printer !== null && printerItem[0].Printer !== 'CANCELLED' && printerItem[0].Printer !== '' ? printerCurrency.find(printer => printer.PrinterName === printerItem[0].Printer).Currency : 'N/A',
				PrinterCalculation: printerInfo.calculation,
				PrinterSummary: printerInfo.totalAmount
			}

			combinedData.push(orderInfo);

		}

		let totalCustomer = 0;
		let totalPrinter = 0;

		for(const item of combinedData){
			totalCustomer += item.Summary;
			totalPrinter += item.PrinterSummary;
		}

		await storeValue("totalCustomerPrice", totalCustomer.toFixed(2))
		await storeValue("totalPrinterPrice", totalPrinter.toFixed(2))
		await storeValue('logSummary',combinedData);
		await storeValue('logSumTableProgress', '');
		showAlert('Order date updated!', 'success');
	},

}