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
				mailClass: lineItem.ProductDescription.includes("First") ? "FC" : "SC",
				inkType: "COLOR",
				pageType: "DS",
				pieceQuantity: lineItem.Qty,
				printQuantity: lineItem.Qty * 2,
				perPages: 2,
				perSheets: 2
			}
		} else if (lineItem.ProductType === "Letter"){
			return {
				mailClass: lineItem.ProductDescription.includes("First") ? "FC" : "SC",
				inkType: lineItem.ProductDescription.includes("BW") ? "BW" : "COLOR",
				pageType: lineItem.ProductDescription.includes("DS") ? "DS" : "SS",	
				pieceQuantity: lineItem.Qty,
				
				printQuantity: lineItem.Qty,
				perPages: lineItem.Qty,
				perSheets: lineItem.Qty
			}
		} else if (lineItem.ProductType === "Cheque"){
			return {
				mailClass: "FC",
				inkType: "BW",
				pageType: "SS",
				pieceQuantity: lineItem.Qty,
				
				printQuantity: lineItem.Qty,
				perPages: 1,
				perSheets: 1
			}
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
				inkType: "BW",
				sameDay: "NO",
				pageType: "DS",
				pieceQuantity: 0,
				printQuantity: 0,
				baseCost: 0,
				additionalCost: "",
				oversize: 0,
				perPages: 0,
				perSheets: 0,
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
			
			//jobDescription -- jobName -- additionalCost -- client Expense -- jobTotalCost2 
			
			//pioritymail -- 

			let jobDescription = '';
			let jobName = '';
			
			for(const lineItem of lineItems){
				orderInfo.jobTotalCost += lineItem.Amount;
				if(lineItem.SubItemID === null){
						const orderDetails = Util.generateSolutionsLetterDetails(lineItem);
						if(orderDetails){
							orderInfo.mailClass = orderDetails.mailClass;
							orderInfo.inkType = orderDetails.inkType;
							orderInfo.pageType = orderDetails.pageType;
							orderInfo.pieceQuantity = orderDetails.pieceQuantity;
							orderInfo.printQuantity = orderDetails.printQuantity;
							orderInfo.perPages = orderDetails.perPages;
							orderInfo.perSheets = orderDetails.perSheets;
						}
					
						orderInfo.baseCost = lineItem.Rate;
						orderInfo.pieceTotalCost += lineItem.Rate;
					
						
					} else {
						if(lineItem.ProductDescription.includes('Extra') || lineItem.ProductDescription.includes('add')){
							orderInfo.printQuantity += lineItem.Qty
							orderInfo.perPages = orderInfo.printQuantity / orderInfo.pieceQuantity;
							orderInfo.perSheets = orderInfo.pageType === "SS" ? orderInfo.pages : (orderInfo.perPages / 2) + (orderInfo.perPages % 2)
						} else if(lineItem.ProductDescription === "SameDay"){
							orderInfo.sameDay = "YES";
							orderInfo.sameDayCost = lineItem.Rate;
							orderInfo.pieceTotalCost += lineItem.Rate;
						} else if (lineItem.ProductDescription.includes("Oversized")){
							orderInfo.oversize = lineItem.Rate;
							orderInfo.pieceTotalCost += lineItem.Rate;
						} else if(lineItem.ProductDescription.includes('Certified Mail')){ //IS THERE MORE THEN JUST THIS??????
							orderInfo.certified = lineItem.Rate;
							orderInfo.pieceTotalCost += lineItem.Rate;
						} else if(lineItem.ProductDescription === "Internationl Delivery"){
							orderInfo.international = lineItem.Rate;
							orderInfo.pieceTotalCost += lineItem.Rate;
						} else if(lineItem.ProductDescription.includes("Perforated")){
							orderInfo.perforation = lineItem.Rate;
							orderInfo.pieceTotalCost += lineItem.Rate;
						}
					}
			}
			
			orderInfo.jobTotalCost = orderInfo.pieceTotalCost * orderInfo.pieceQuantity;

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
		await storeValue(
			'logSumDates', 
			{
				startDate: StartDate_Picker_solutions.selectedDate,
				endDate: EndDate_Picker_solutions.selectedDate
			}
		)

		await get_customer_price_info.run();
		await get_printer_currency.run();

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

		console.log("JG customerLineItems", customerLineItems)

		for (const value of customerLineItems) {
			const solutionsItemInfo = getSolutionsInfo(value)
			
			const solutionsInfo = {
				Date: moment(value[0].InvoiceDate).format('DD-MMM'),
				'Client Name': value[0].CustomerName,
				'Job Description':solutionsItemInfo.jobDescription,
				'Job Name': solutionsItemInfo.jobName,
				SameDay: solutionsItemInfo.sameDay,
				'Mail Class': solutionsItemInfo.mailClass,
				'Ink Type': solutionsItemInfo.inkType,
				'Page Type': solutionsItemInfo.pageType,
				'Piece Quantity': solutionsItemInfo.pieceQuantity,
				'Print Quantity': solutionsItemInfo.printQuantity,
				'Base Cost': solutionsItemInfo.baseCost,
				'Additional Cost': solutionsItemInfo.additionalCost,
				Oversize: solutionsItemInfo.oversize,
				'Per Pages': solutionsItemInfo.perPages,
				'Per Sheets': solutionsItemInfo.perSheets,
				'Certified Mail': solutionsItemInfo.certified,
				'Priority Mail': solutionsItemInfo.priority,
				'SameDay Price': solutionsItemInfo.sameDayCost,
				International: solutionsItemInfo.international,
				Perforation: solutionsItemInfo.perforation,
				'Piece Total Cost': solutionsItemInfo.pieceTotalCost,
				'Job Total Cost': solutionsItemInfo.jobTotalCost,
				'PG Client Expense': solutionsItemInfo.clientExpense,
				'Job Total Cost 2': solutionsItemInfo.jobTotalCost2,
				Notes: ""
			}

			combinedData.push(solutionsInfo);
		}
		await storeValue('solutionsLogSummary',combinedData);
		await storeValue('solutionsLogSumTableProgress', '');
		showAlert('Solutions Log Sum Created!', 'success');
	},

}