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

				printQuantity: lineItem.Qty * lineItem.Pages,
				perPages: lineItem.Pages,
				perSheets: lineItem.ProductDescription.includes("DS") ? (Math.floor(lineItem.Pages / 2)) + (lineItem.Pages % 2) : lineItem.Pages
			}
		} else if (lineItem.ProductType === "Cheque"){
			return {
				mailClass: "FC",
				inkType: "BW",
				pageType: "SS",
				pieceQuantity: lineItem.Qty,

				printQuantity: lineItem.Qty * lineItem.Pages,
				perPages: lineItem.Pages,
				perSheets: lineItem.Pages
			}
		} else {
			//selfmailer
		}
		return;
	},
	generateJobNameDescription: (orderInfo, clientName) => {
		const customClients = new Map([
			['AtoB', 'AtoB'],
			['Highland Health Direct', 'FFW_HighlandHealthDirect'],
			['Clek', 'Clek'],
			['Pearl Health', 'PearlHealth'],
			['Accompany Health Inc', 'AccompanyHealthInc'],
			['RazorMetrics', 'RazorMetrics'],
			['Defendify', 'Defendify'],
			['mydmedoc', 'MyDmeDoc'],
			['Titanvest', 'Titanvest'],
			['Newgent Management', 'Newgent'],
			['Octopus Energy', 'OctopusEnergy'],
			['MedX Services INC', 'MedxServicesInc'],
			['Swyftconnect', 'Swyftconnect'],
			['Carrier-Robins Law Firm', 'CarrierRobins'],
			['Sylvan Health', 'SylvanHealth'],
			['Bridging Care', 'BridgingCare'],
			['Hopscotch Health', 'Hopscotch'],
			['Country Canvas Awnings', 'CCA']
		]);
		let jobDescriptionDetails = '';
		let jobDescriptionExtras = '';

		const generateJobName = () =>{
			const generateLetterEnding = () => {
				let generic = true;
				let letterEndingText = '';

				if(orderInfo.returnEnvelope || orderInfo.customEnvelope){
					const customClient = customClients.get(clientName);
					if(customClient){
						letterEndingText += `_${customClient}` 
					}
				}

				if(orderInfo.perforation > 0 ){
					letterEndingText += '_PerforatedPaper';
				}

				if(orderInfo.certified > 0){
					generic = false;
					letterEndingText = '_CertifiedMail' + letterEndingText + orderInfo.withSignature ? '_RR' : '_NRR';
				}

				if(clientName === "Enter"){
					generic = false;
					letterEndingText = "EnterHealth"
				}

				if(generic){
					letterEndingText = '_Generic'
				}

				return letterEndingText
			}

			if(orderInfo.mailType === 'Postcard'){
				return `Postcards${orderInfo.international > 0 ? '_International' : ''}${orderInfo.priorityText.includes('Express') ? '_Expresss' : ''}_${orderInfo.postcardSize}`
			} else if(orderInfo.mailType === 'Letter'){
				return `${
				orderInfo.international > 0 ? 'International' : orderInfo.priorityText.includes('Express') ? '_Expresss' : orderInfo.mailClass
			}_${
				orderInfo.inkType === 'BW' ? 'BW' : 'Color'
			}_${orderInfo.pageType}${generateLetterEnding()}`
			} else {
				return `${
				orderInfo.priorityText.includes('Express') ? '_Expresss' : orderInfo.mailClass
			}_Cheques_${
				orderInfo.perPages > 1 ? 'WithDocuments' : 'Only'
			}${
				orderInfo.certified === 0 ? '' : orderInfo.withSignature ? '_CertifiedMail_RR' : '_CertifiedMail_NRR'
			}`
			}
		}

		const generateExtras = () => {
			const extras = [];
			if(orderInfo.sameDay === 'YES'){
				extras.push('SameDay')
			}
			if(orderInfo.returnEnvelope){
				extras.push(`Return Envelope - ${clientName}`)
			}
			if(orderInfo.customEnvelope){
				extras.push(`Custom Envelope - ${clientName}`)
			}
			if(orderInfo.perforation > 0 ){
				extras.push('Perforated')
			}
			if(orderInfo.certified > 0){
				extras.push(`Certified Mail ${orderInfo.withSignature ? 'with Signature' : 'w/o Signature'}`)
			}
			if(orderInfo.priority > 0){
				extras.push(orderInfo.priorityText)
			}
			if(orderInfo.international > 0){
				extras.push(`International - ${orderInfo.destination}`)
			}
			return extras;
		}

		if(orderInfo.mailType === 'Letter'){
			jobDescriptionDetails = `(${orderInfo.perPages}-page ${orderInfo.inkType} ${orderInfo.pageType === 'DS' ? 'double-sided' : 'single-sided'})`

		} else if(orderInfo.mailType === 'Postcard'){
			jobDescriptionDetails = `(${orderInfo.postcardSize})`
		} else {
			jobDescriptionDetails = `${orderInfo.perPages > 1 ? `with ${orderInfo.perPages} letter Attachment` : ''}`;
		}
		jobDescriptionExtras = generateExtras().join(' ');
		return {
			jobDescription: `${orderInfo.mailType} ${jobDescriptionDetails} - (${clientName}) ${jobDescriptionExtras}`,
			jobName: generateJobName()
		}

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
		const getSolutionsInfo = (lineItems, clientName) => {
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
				additionalCost: 0,
				oversize: 0,
				perPages: 0,
				perSheets: 0,
				certified: 0,
				withSignature: false,
				priority: 0,
				priorityText: '',
				sameDayCost: 0,
				international: 0,
				destination: '',
				perforation: 0,
				pieceTotalCost: 0,
				jobTotalCost: 0,
				postcardSize: '',
				mailType: '',
				returnEnvelope: false,
				customEnvelope: false,
				stampQuantity: 0,
				tabbingFee: 0,
			}

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
					
					if(clientName === "Credit Glory Inc" || clientName === "Credit Sage LLC"){
						orderInfo.stampQuantity = 
								orderInfo.perSheets < 4 ? 1 :
								orderInfo.perSheets >= 4 && orderInfo.perSheets <= 8 ? 2 :
								orderInfo.perSheets === 9 ? 3 :
								orderInfo.perSheets >= 10 && orderInfo.perSheets <= 21 ? 4 :
								orderInfo.perSheets >= 22 && orderInfo.perSheets <= 32 ? 5 :
								orderInfo.perSheets >= 33 && orderInfo.perSheets <= 40 ? 6 :
								orderInfo.perSheets >= 41 && orderInfo.perSheets <= 48 ? 7 :
								0
					}

					orderInfo.baseCost = lineItem.Rate ?? 0;

					if(lineItem.ProductType === 'Letter'){
						orderInfo.mailType = 'Letter'
					} else if(lineItem.ProductType === 'Postcard'){
						orderInfo.mailType = 'Postcard';
						orderInfo.postcardSize = lineItem.ProductDescription.includes('4x6') ? '6x4' : lineItem.ProductDescription.includes('6x9') ? '9x6' : '11x6'
					} else {
						orderInfo.mailType = 'Cheques'
					}

				} else {
					if(lineItem.ProductDescription.includes('Extra') || lineItem.ProductDescription.includes('add')){
						orderInfo.printQuantity += lineItem.Qty;
						orderInfo.additionalCost = lineItem.Rate ?? 0;
						if(orderInfo.mailType === 'Cheques' && orderInfo.perPages === 1){ 
							orderInfo.perPages = 2;
						}
					} else if(lineItem.ProductDescription === "SameDay"){
						orderInfo.sameDay = "YES";
						orderInfo.sameDayCost = lineItem.Rate ?? 0;
					} else if (lineItem.ProductDescription.includes("Oversized")){
						orderInfo.oversize = lineItem.Rate ?? 0;
					} else if(lineItem.ProductDescription.includes('Certified Mail')){
						orderInfo.certified = lineItem.Rate ?? 0;
						orderInfo.withSignature = lineItem.ProductDescription.includes('NRR') ? false : true
					} else if(lineItem.ProductDescription === "International Delivery"){
						orderInfo.destination = lineItem.Destination;
						orderInfo.international = lineItem.Rate ?? 0;
					} else if(lineItem.ProductDescription.includes("Perforated")){
						orderInfo.perforation = lineItem.Rate ?? 0;
					} else if(lineItem.MailType === "Express"){
						orderInfo.priorityText = lineItem.ProductDescription;
						orderInfo.priority = lineItem.Rate ?? 0;
					} else if (lineItem.productType === "Envelope"){
						if(lineItem.MailType === "Custom Envelope"){
							orderInfo.customEnvelope = true;
						} else if(lineItem.MailType === "Return Envelope"){
							orderInfo.returnEnvelope = true;
						}
					} else if(lineItem.ProductDescription === "Tabbing"){
						orderInfo.tabblingFee =  lineItem.Rate ?? 0;
					}
				}
			}

			orderInfo.pieceTotalCost = (
				orderInfo.baseCost + orderInfo.oversize + orderInfo.certified + orderInfo.priority + orderInfo.sameDayCost + orderInfo.international + orderInfo.perforation + orderInfo.tabbingFee + ((orderInfo.perSheets > 1 ? orderInfo.perSheets - 1 : 1) * orderInfo.additionalCost )
			);


			orderInfo.jobTotalCost = orderInfo.pieceTotalCost * orderInfo.pieceQuantity;
			const jobNameDescription = this.generateJobNameDescription(orderInfo, clientName);
			orderInfo.jobDescription = jobNameDescription.jobDescription;
			orderInfo.jobName = jobNameDescription.jobName;

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

		await get_printer_currency.run();
		await get_allorder_printcost.run();

		const combinedData = [];
		const filteredPrinterItems = (() => {
			let items = get_allorder_printcost.data;
			if(Organization_select_solutions.selectedOptionValue !== "all"){
				items = items.filter(item => item.CustomerName === selectedOrg)
			}

			if(Printer_select_solutions.selectedOptionValue !== 'All'){
				items = items.filter(item => item.Printer === Printer_select_solutions.selectedOptionValue)
			}
			return items;
		})()

		const printerLineItems = generateOrderLineMap(filteredPrinterItems);

		for (const value of printerLineItems) {
			const solutionsItemInfo = getSolutionsInfo(value, value[0].CustomerName)

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
				'Base Cost': solutionsItemInfo.baseCost === 0 ? '' : solutionsItemInfo.baseCost.toFixed(4),
				'Additional Cost': solutionsItemInfo.additionalCost === 0 ? '' : solutionsItemInfo.additionalCost.toFixed(4),
				Oversize: solutionsItemInfo.oversize === 0 ? '' : solutionsItemInfo.oversize.toFixed(4),
				'Per Pages': solutionsItemInfo.perPages,
				'Per Sheets': solutionsItemInfo.perSheets,
				'Certified Mail': solutionsItemInfo.certified === 0 ? '' : solutionsItemInfo.certified.toFixed(4),
				'Priority Mail': solutionsItemInfo.priority === 0 ? '' : solutionsItemInfo.priority.toFixed(4),
				'SameDay Price': solutionsItemInfo.sameDayCost === 0 ? '' : solutionsItemInfo.sameDayCost.toFixed(4),
				International: solutionsItemInfo.international === 0 ? '' : solutionsItemInfo.international.toFixed(4),
				Perforation: solutionsItemInfo.perforation === 0 ? '' : solutionsItemInfo.perforation.toFixed(4),
				'Number of Stamps': solutionsItemInfo.stampQuantity === 0 ? '' : solutionsItemInfo.stampQuantity,
				'Tabbing Fee': solutionsItemInfo.tabbingFee === 0 ? '' : solutionsItemInfo.tabbingFee.toFixed(4),
				'Piece Total Cost': solutionsItemInfo.pieceTotalCost.toFixed(2),
				'Job Total Cost': solutionsItemInfo.jobTotalCost.toFixed(2),
				Notes: ""
			}

			combinedData.push(solutionsInfo);
		}
		await storeValue('solutionsLogSummary',combinedData);
		await storeValue('solutionsLogSumTableProgress', '');
		showAlert('Solutions Log Sum Created!', 'success');
	},

}