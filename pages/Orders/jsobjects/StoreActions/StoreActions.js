export default {
	myFun1: async (currentRow) => {
		await storeValue("rowUpdate",currentRow);
		await Save_Data.run({currentRow});

		//change printerPriceID for the current order
		const printerName = currentRow.AssignTo;
		const printerInfo = await get_printer_info.run({printerName});
		const allItems = await get_selected_printer_item_sing.run()
		const itemsList = allItems.map(item => {
			return {
				printerId: printerInfo[0].Id,
				printerTier: printerInfo[0].tier_level_id,
				productId: item.ProductID,
				itemId: item.Id,
				qty: item.Qty
			}
		})

		await storeValue('printerItemsList',JSON.parse(JSON.stringify(itemsList).replaceAll("'", "''")));	
		await set_printer_price_id.run();

		await get_customer_order_details.run();
		await get_PauseCancel_custOrderDetai.run();
		await Util.getSelectedPrinterItems();

		// add mongo connection and update the vendor for this
		await get_printer_line_item.run({currentRow});
		const orderGroupIDs = [(await get_printer_line_item.run({currentRow}))[0].OrderGroupID];
		const groupType = orderGroupIDs[0].slice(0, orderGroupIDs[0].indexOf("_"));

		const vendorID = await (async () => {
			if(currentRow.AssignTo === "PAUSED" || currentRow.AssignTo === "CANCELLED"){
				return currentRow.AssignTo;
			}
			return (await getVendorID.run({
				vendorName: currentRow.AssignTo
			}))[0]._id;
		})();

		if(groupType === 'letter'){
			await Update_LetterGroup.run({
				orderGroupID: orderGroupIDs,
				vendorID: vendorID
			});
		} else if(groupType === 'postcard'){
			await Update_PostcardGroup.run({
				orderGroupID: orderGroupIDs,
				vendorID: vendorID
			});
		} else {
			await Update_ChequeGroup.run({
				orderGroupID: orderGroupIDs,
				vendorID: vendorID
			});
		}
		showAlert('Vendor has been updated successfully', 'success');
	},
	updateAllItemsVendor: async () => {		
		await set_AllToPrinter.run();

		//change printerPriceID for the current order
		const printerName = appsmith.store.MBitem;
		const printerInfo = await get_printer_info.run({printerName});
		const allItems = await get_selected_printer_item_all.run({invoiceID: Table2.selectedRow.InvoiceNo})
		const itemsList = allItems.map(item => {
			return {
				printerId: printerInfo[0].Id,
				printerTier: printerInfo[0].tier_level_id,
				productId: item.ProductID,
				itemId: item.Id,
				qty: item.Qty
			}
		})
		await storeValue('printerItemsList',JSON.parse(JSON.stringify(itemsList).replaceAll("'", "''")));	
		await set_printer_price_id.run();

		await StoreActions.updateOrderGroupVendors();
		await get_customer_order_details.run();
		await get_PauseCancel_custOrderDetai.run();
		await Util.getSelectedPrinterItems();
		await showAlert('Vendors successfully updated!.','success');
	},
	clearOrderGroupVendor: async (currentRow) => {
		await Save_Data.run({currentRow: {
			AssignTo: "",
			itemid: currentRow.itemid
		}});
		
		console.log("JG currentRow", currentRow)
		
		await storeValue("rowUpdate", {itemid: currentRow.itemid})
		// console.log("JG await get_printer_line_item.run({currentRow}", await get_printer_line_item.run())

		const orderGroupIDs = (await get_printer_line_item.run()).map(item => item.OrderGroupID);
		console.log("JG orderGroupIDs", orderGroupIDs)
		
		await storeValue("clearVendor", {
			orderGroupID: orderGroupIDs,
			vendorID: ""
		})

		if(orderGroupIDs.length > 0){
			const groupType = orderGroupIDs[0].slice(0, orderGroupIDs[0].indexOf("_"));

			if(groupType === 'letter'){
				await Update_LetterGroup.run();
			} else if(groupType === 'postcard'){
				await Update_PostcardGroup.run();
			} else {
				await Update_ChequeGroup.run();
			}
		}

	},
	updateOrderGroupVendors: async () => {
		const orderGroupIDs = await Promise.all(Table3Copy.tableData.slice(0, -1).map(async (currentRow) => {
			await storeValue("rowUpdate",currentRow);
			return (await get_printer_line_item.run())[0].OrderGroupID;
		}));

		const letterOrderGroups = [];
		const postcardOrderGroups = [];
		const chequeOrderGroups = [];

		for(const orderGroupID of orderGroupIDs){
			if(orderGroupID !== "null"){
				const groupType = orderGroupID.slice(0, orderGroupID.indexOf("_"));
				if(groupType === 'letter'){
					letterOrderGroups.push(orderGroupID);
				} else if(groupType === 'postcard'){
					postcardOrderGroups.push(orderGroupID);
				} else {
					chequeOrderGroups.push(orderGroupID);
				}
			}
		}

		const vendorID = await (async () => {
			if(appsmith.store.MBitem === "PAUSED" || appsmith.store.MBitem === "CANCELLED"){
				return appsmith.store.MBitem;
			}
			return (await getVendorID.run({
				vendorName: appsmith.store.MBitem
			}))[0]._id;
		})();

		if(letterOrderGroups.length > 0){
			await Update_LetterGroup.run({
				orderGroupID: letterOrderGroups,
				vendorID: vendorID
			});
		}

		if(postcardOrderGroups.length > 0){
			await Update_PostcardGroup.run({
				orderGroupID: postcardOrderGroups,
				vendorID: vendorID
			});
		}

		if(chequeOrderGroups.length > 0){
			await Update_ChequeGroup.run({
				orderGroupID: chequeOrderGroups,
				vendorID: vendorID
			});
		}
		showAlert('Vendor has been updated successfully', 'success')
	},
	myFun2: async (currentRow) => {
		await storeValue("rowUpdate",currentRow);
		await Save_Data2.run({currentRow});
		await get_customer_order_details.run();
		await get_printer_order_details.run(()			=> { get_letter_day_volume.run(),
			get_cheque_day_volume.run(), get_postcard_day_volume.run(), showAlert('Well done!.','success')}, () => {});
	},	
	myFun3: async (currentRow) => {
		await storeValue("rowUpdate",currentRow);
		await Save_Data3.run({currentRow});
		await get_printer_order_details.run(()			=> {  showAlert('Well done!.','success')}, () => {});
	},	
	rundateoforder: async () => {
		await get_invoicelist.run(()=>{
			get_PauseCancel_custOrderDetai.run(),
				get_invoicelist_count.run(),
				get_letter_day_volume.run(),
				get_postcard_day_volume.run(),
				get_cheque_day_volume.run(),
				showAlert('Order date updated!', 'success')
		}, () => {});
	},
	/**
  * @param {(LetterGroup | PostcardGroup)[]} groups
  * @param {(group: LetterGroup | PostcardGroup) => LineItem[]} groupItemsFn
  */
	mapGroups(groups, groupItemsFn) {
		/** @type LineItem[] */
		const items = [];

		for (const group of groups) {
			const groupItems = groupItemsFn(group);

			items.push(...groupItems);
		}

		return items;
	},
	/**
     * @typedef { import('./types').LetterGroup } LetterGroup
     */

	/**
     * @typedef { import('./types').PostcardGroup } PostcardGroup
     */

	/**
     * @typedef { import('./types').ChequeGroup } ChequeGroup
     */

	/**
     * @typedef { import('./types').LineItem } LineItem
     */

	/**
     * @param {LetterGroup | PostcardGroup | ChequeGroup} group
     */
	classStr(group) {
		if (group.destinationCountryCode === 'CA') {
			if (group.mailingClass === 'standard_class') {
				return 'Personalized';
			}

			return 'Lettermail';
		}

		if (
			group.destinationCountryCode === 'GB' ||
			group.destinationCountryCode === 'AU'
		) {
			if (group.mailingClass === 'standard_class') {
				return 'Second Class';
			}

			return 'First Class';
		}

		if (group.mailingClass === 'standard_class') {
			return 'Standard Class';
		}

		return 'First Class';
	},

	/**
     * @param {any} group
     * @returns {group is (LetterGroup | ChequeGroup)}
     */
	isLetterOrChequeGroup(group) {
		return group.extraService !== undefined;
	},

	/**
     * @typedef {Pick<LineItem, 'orgID' | 'orgName' | 'quantity' | 'mailType' | 'productDesc' | 'destinationCountryCode'> & { destinationCountryCode: null }} LineItemWithoutID
     *
     * @param {LetterGroup | PostcardGroup | ChequeGroup} group
     * @param {string} orgName
     * @returns {LineItemWithoutID[]}
     */
	baseGroupItems(group, orgName, orgCountryCode) {
		/** @type LineItemWithoutID[] */
		const items = [];

		if (group.express) {
			/** @type {LineItemWithoutID} */
			const expressItem = {
				orgID: group.organization,
				orgName,
				quantity: group.orderCount,
				mailType: 'Express',
				productDesc: (() => {
					if (group.destinationCountryCode === 'AU') {
						return 'Australia Post Express';
					}

					if (group.destinationCountryCode === 'GB') {
						return 'Royal Mail Express';
					}

					if (group.destinationCountryCode === 'CA') {
						return 'UPS CA Express';
					}

					return 'USPS - 1 to 3 Days';
				})(),
				destinationCountryCode: null,
			};

			items.push(expressItem);
		}

		if (group.sameDay) {
			/** @type {LineItemWithoutID} */
			const sameDayItem = {
				orgID: group.organization,
				orgName,
				quantity: group.orderCount,
				mailType: 'Delivery SLA',
				productDesc: 'SameDay',
				destinationCountryCode: null,
			};

			items.push(sameDayItem);
		}

		if (this.isLetterOrChequeGroup(group) && group.extraService) {
			/** @type {LineItemWithoutID} */
			const extraServiceItem = {
				orgID: group.organization,
				orgName,
				quantity: group.orderCount,
				mailType: 'Added Services',
				productDesc: {
					certified: 'Certified Mail NRR',
					certified_return_receipt: 'Certified Mail RR',
					registered: 'Registered Mail',
				}[group.extraService],
				destinationCountryCode: null,
			};

			items.push(extraServiceItem);
		}

		if (orgName !== "MIJN AFSPRAKEN B.V." &&
				((group.destinationCountryCode !== 'US' &&
					group.destinationCountryCode !== 'CA' &&
					group.destinationCountryCode !== 'GB' &&
					group.destinationCountryCode !== 'AU') || 
				 (group.destinationCountryCode !== orgCountryCode && (
			group.destinationCountryCode !== 'AS' && orgCountryCode === 'US'
		)))
			 ) {
			/** @type {LineItemWithoutID} */
			const intlItem = {
				orgID: group.organization,
				orgName,
				quantity: group.orderCount,
				mailType: 'Added Services',
				productDesc: 'International Delivery',
				destinationCountryCode: null,
			};

			items.push(intlItem);
		}

		return items;
	},
	formatLetterCollateral: (item, group, oversize) => {
		const generateSheetCount = () => {
			return group.doubleSided
				? Math.ceil(group.pageCount / 2)
			: group.pageCount;
		}
		//Credit Glory Inc
		if(group.organization === "org_aVjt8NWrfQjqk1PRegvBpV"){
			return{
				...item,
				mailType: 'Custom',
				productDesc: `${item.productDesc} - CreditGlory`
			};
		}

		//HomeOptions.ai
		if(group.organization === "org_rTPY7kJULSh1pUWSr7wxhG"){
			return{
				...item,
				mailType: 'Custom',
				productDesc: item.productDesc += " - HomeOptionsFlatmail"
			};
		}

		//Accuhealth Technologies LLC
		if(group.organization === "org_fP1wzD9LXbwSdZ5MDHbNBw"){
			return{
				...item,
				mailType: 'Custom',
				productDesc: item.productDesc += " - AccuHealth"
			};
		}

		//Enter Health
		if(group.organization === "org_3pWY3piAx4H7XNrpY25RU2"){
			const sheetCount = generateSheetCount();
			if(group.extraService === "certified"){
				return{
					...item,
					mailType: 'Custom',
					productDesc: item.productDesc += " - EHCUSBOX_CERTNRR"
				};
			} else if(group.extraService === "certified_return_receipt"){
				return{
					...item,
					mailType: 'Custom',
					productDesc: item.productDesc += " - EHCUSBOX_CERTRR"
				};
			} else if(sheetCount >= 20 && oversize == true){
				return{
					...item,
					mailType: 'Custom',
					productDesc: "Oversized (over 20-300 sheets) - EHCUSTOM"
				};
			} else {
				return{
					...item,
					mailType: 'Custom',
					productDesc: item.productDesc += " - EHCUSTOM"
				};
			}
		}

		//Trinity Medical Management
		if(group.organization === "org_wUB4oa68YQgdQNYTeiSYNQ"){
			if(group.extraService === "certified"){
				return{
					...item,
					mailType: 'Custom',
					productDesc: item.productDesc += " - TMMCUSBOX_CERTNRR"
				};
			} else if(group.extraService === "certified_return_receipt"){
				return{
					...item,
					mailType: 'Custom',
					productDesc: item.productDesc += " - TMMCUSBOX_CERTRR"
				};
			}
			return{
				...item,
				mailType: 'Custom',
				productDesc: item.productDesc += " - TMMCUSBOX"
			};
		}
		return item;
	},
	letterGroupsLineItems(orgNames) {
		/** @param {LetterGroup} group */
		const groupLineItems = (group) => {
			/** @type {LineItem[]} */
			const items = [];

			const orgName = orgNames.get(group.organization) ?? '(Unknown)';
			const orgCountryCode = orgs.data.find(org => org._id === group.organization).countryCode ?? "US";

			const sizeStr = group.destinationCountryCode === 'GB' ||
						group.destinationCountryCode === 'AU' ? 'A4 Size' : {
							us_letter: 'Letter Size',
							us_legal: 'Legal Size',
							a4: 'A4 Size',
						}[group.size];

			const colorDoubleSidedStr = `${group.color ? 'CLR' : 'BW'} ${
			group.doubleSided ? 'DS' : 'SS'
			}`;

			const classStr = this.classStr(group);

			let id = UUID.generate();

			/** @type LineItem */
			const baseItem = StoreActions.formatLetterCollateral({
				id: id,

				orgID: group.organization,
				orgName,

				quantity: group.orderCount,
				mailType: 'Letter',
				productDesc: `${sizeStr} - ${colorDoubleSidedStr} - ${classStr}`,
				destinationCountryCode: group.destinationCountryCode,

				parentID: null,
				vendor: group.vendor,
				groupID: group._id,
				pages: group.pageCount
			}, group);

			items.push(baseItem);

			const innerItems = this.baseGroupItems(group, orgName, orgCountryCode);

			for (const item of innerItems) {
				const innerId = UUID.generate();
				items.push({
					...item,

					id: innerId,
					destinationCountryCode: null,

					parentID: baseItem.id,
					groupID: null,
					pages: null
				});
			}

			// TODO(Apaar): Is Math.ceil robust enough for our use case? Is there ever
			// a scenario where 4 / 2 could be rounded to 3?
			const sheetCount = group.doubleSided ? Math.ceil(group.pageCount / 2)
			: group.pageCount;

			if (sheetCount > 1) {
				/** @type {LineItem} */
				const addlSheetItem = StoreActions.formatLetterCollateral({
					id: UUID.generate(),

					orgID: group.organization,
					orgName,

					quantity: group.orderCount * (sheetCount - 1),
					mailType: "Add'l Page",
					productDesc: `${sizeStr} - Extra Sheet ${colorDoubleSidedStr}`,
					destinationCountryCode: null,

					parentID: baseItem.id,
					groupID: null,
					pages: null
				},group);

				items.push(addlSheetItem);

				if (sheetCount > 6) {
					const sheetRange = sheetCount <= 60 ? 'over 6' : sheetCount > 60 && sheetCount <= 150 ? '61 - 150' : sheetCount > 150 && sheetCount <= 300 ? '151 - 300' : 'over 300'
					/** @type {LineItem} */
					const oversizedItem = StoreActions.formatLetterCollateral({
						id: UUID.generate(),

						orgID: group.organization,
						orgName,

						quantity: group.orderCount,
						mailType: 'Added Services',
						productDesc: `Oversized (${sheetRange} sheets)`,
						destinationCountryCode: null,

						parentID: baseItem.id,
						groupID: null,
						pages: null
					}, group, true);

					if(group.organization === "org_3pWY3piAx4H7XNrpY25RU2" && sheetCount >= 20 || (group.organization !== "org_3pWY3piAx4H7XNrpY25RU2" && sheetCount > 6 && group.organization !== "org_wUB4oa68YQgdQNYTeiSYNQ")){
						items.push(oversizedItem);
					}
				}
			}

			if (group.perforatedPage) {
				/** @type {LineItem} */
				const perforatedItem = {
					id: UUID.generate(),

					orgID: group.organization,
					orgName,

					quantity: group.orderCount,
					mailType: 'Added Services',
					productDesc: 'Perforated',
					destinationCountryCode: null,

					parentID: baseItem.id,
					groupID: null,
					pages: null
				};

				items.push(perforatedItem);
			}

			if (group.returnEnvelope) {
				let envelopeName = '';
				if(group.returnEnvelope === 'return_envelope_9KgsgkKFe5YYuT2QLuZbdq'){
					envelopeName = 'SylvanHealth Ret Envelope';
				} else if (group.returnEnvelope === 'return_envelope_mkG3NHTZZUnaz6jahkJRX5'){
					envelopeName = "BridgingCare(Construqt) Ret Envelope";
				} else {
					envelopeName = `${
					group.destinationCountryCode === 'US' ? orgName + ' '
					: ''
				}#9 Envelope`;
				}

				/** @type {LineItem} */
				const returnEnvelopeItem = {
					id: UUID.generate(),

					orgID: group.organization,
					orgName,

					quantity: group.orderCount,
					mailType: 'Return Envelope',

					// We only seem to specify org in US
					productDesc: envelopeName,
					destinationCountryCode: null,

					parentID: baseItem.id,
					groupID: null,
					pages: null
				};

				items.push(returnEnvelopeItem);
			}

			const customEnvelopeOrgs = [
				'Country Canvas Awnings',
				'Highland Health Direct',
				'Carrier-Robins Law Firm',
				'ECA GreenTech',
				'Pearl Health',
				'Accompany Health Inc',
				'RazorMetrics',
				'ERC Partners, LLC'
			];
			// Check for orgs with custom envelopes
			if(
				customEnvelopeOrgs.includes(orgName)
			) {
				let envelopeName= '';
				switch(orgName) {
					case 'Country Canvas Awnings':
						envelopeName = 'Country Canvas Awnings #10 Envelope';
						break;
					case 'Highland Health Direct':
						envelopeName = 'Highland Health Direct Full Front Window Envelope';
						break;
					case 'Carrier-Robins Law Firm':
						envelopeName = 'CarrierRobins #10 Envelope';
						break;
					case 'ECA GreenTech':
						envelopeName = 'ECA Greentech #10 Envelope';
						break;
					case 'Pearl Health':
						envelopeName = 'Pearl Health 9x12 Envelope';
						break;
					case 'Accompany Health Inc':
						envelopeName = 'Accompany Health Custom Envelope';
						break;
					case 'RazorMetrics':
						envelopeName = 'RazorMetrics Custom Envelope';
						break;
					case 'ERC Partners, LLC':
						envelopeName = 'ERC Partners, LLC (Garett Law) Custom Envelope';
						break;
				}

				/** @type {LineItem} */
				const customEnvelopeItem = {
					id: UUID.generate(),

					orgID: group.organization,
					orgName,

					quantity: group.orderCount,
					mailType: 'Custom Envelope',
					productDesc: envelopeName,
					destinationCountryCode: null,

					parentID: baseItem.id,
					groupID: null,
					pages: null
				};

				items.push(customEnvelopeItem);
			}

			return items;
		};

		return this.mapGroups(letterGroups.data, groupLineItems);
	},
	formatPostcardCollateral: (item, group, classStr) => {
		//Perbelle
		if(group.organization === "org_rUZTFHAodjrRhzxCP6LUzo"){
			return{
				...item,
				mailType: 'Custom',
				productDesc: item.productDesc += " - Perbelle"
			};
		}

		//EcoFlow
		if(group.organization === "org_eYKpX4E8GT8iwAbTtHd3BX"){
			return{
				...item,
				mailType: 'Custom',
				productDesc: item.productDesc += " - EcoFlow"
			};
		}

		//CRC
		if(group.organization === "org_iWccrJCPmbqmVbz1j1yNXg"){
			if(item.productDesc.includes("6x11") || item.productDesc.includes("11x6_reduced")){
				return{
					...item,
					mailType: 'Custom',
					productDesc: `Postcard 6x11 - ${classStr} - CRC Reduced`
				};
			} else if(item.productDesc.includes("6x9") || item.productDesc.includes("9x6_reduced")){
				return{
					...item,
					mailType: 'Custom',
					productDesc: `Postcard 6x9 - ${classStr} - CRC Reduced`
				};
			}

		}
		return item;
	},
	postcardGroupsLineItems(orgNames) {
		/** @param {PostcardGroup} group */
		const groupLineItems = (group) => {
			/** @type LineItem[] */
			const items = [];

			const orgName = orgNames.get(group.organization) ?? '(Unknown)';
			const orgCountryCode = orgs.data.find(org => org._id === group.organization).countryCode ?? "US";

			let sizeStr = '';
			if(group.size === "9x6_reduced" || group.size === "11x6_reduced"){
				sizeStr = group.size;
			} else {
				sizeStr = group.size.split('').reverse().join('');
			}

			const classStr = this.classStr(group);

			let id = UUID.generate();

			/** @type LineItem */
			const baseItem = this.formatPostcardCollateral({
				id: id,

				orgID: group.organization,
				orgName,

				quantity: group.orderCount,
				mailType: 'Postcard',
				productDesc: `Postcard ${sizeStr} - ${classStr}`,
				destinationCountryCode: group.destinationCountryCode,

				parentID: null,
				vendor: group.vendor,
				groupID: group._id,
				pages: null
			},group,classStr);

			items.push(baseItem);

			const innerItems = this.baseGroupItems(group, orgName, orgCountryCode);

			for (const item of innerItems) {
				const innerId = UUID.generate();
				items.push({
					...item,

					id: innerId,
					destinationCountryCode: null,

					parentID: baseItem.id,
					groupID: null,
					pages: null
				});
			}

			// kimkim.com's postcards are laminated
			if (group.organization === 'org_6pFGLJ6c1N6zT1xrrRYKe9') {
				/** @type {LineItem} */
				const lamItem = {
					id: UUID.generate(),

					orgID: group.organization,
					orgName,

					quantity: group.orderCount,
					mailType: 'Added Services',
					productDesc: `${sizeStr} Lamination`,
					destinationCountryCode: null,

					parentID: baseItem.id,
					groupID: null,
					pages: null
				};

				items.push(lamItem);
			}

			return items;
		};

		return this.mapGroups(postcardGroups.data, groupLineItems);
	},

	chequeGroupsLineItems(orgNames) {
		/** @param {ChequeGroup} group */
		const groupLineItems = (group) => {
			/** @type LineItem[] */
			const items = [];

			const orgName = orgNames.get(group.organization) ?? '(Unknown)';
			const orgCountryCode = orgs.data.find(org => org._id === group.organization).countryCode ?? "US";

			const sizeStr = {
				us_letter: 'Letter Size',
				us_legal: 'Legal Size',
			}[group.size];

			const classStr = this.classStr(group);

			let id = UUID.generate();

			/** @type LineItem */
			const baseItem = {
				id: id,

				orgID: group.organization,
				orgName,

				quantity: group.orderCount,
				mailType: 'Cheque',
				productDesc: `${sizeStr} - Cheque Only - ${classStr}`,
				destinationCountryCode: group.destinationCountryCode,

				parentID: null,
				vendor: group.vendor,
				groupID: group._id,
				pages: null
			};

			items.push(baseItem);

			const innerItems = this.baseGroupItems(group, orgName, orgCountryCode);

			for (const item of innerItems) {
				const innerId = UUID.generate();
				items.push({
					...item,

					id: innerId,

					parentID: baseItem.id,
					groupID: null,
					pages: null
				});
			}

			if (group.letterPageCount) {
				// Assume BW SS for cheque letters
				const sheetCount = group.letterPageCount;

				/** @type {LineItem} */
				const addlSheetItem = {
					id: UUID.generate(),

					orgID: group.organization,
					orgName,

					// For these, each sheet is additional, not just those after the first
					quantity: group.orderCount * sheetCount,
					mailType: "Add'l Page",
					productDesc: `${sizeStr} - Cheque add'l Sheet`,
					destinationCountryCode: null,

					parentID: baseItem.id,
					groupID: null,
					pages: null
				};

				items.push(addlSheetItem);
			}

			return items;
		};

		return this.mapGroups(chequeGroups.data, groupLineItems);
	},
	selfmailerGroupsLineItems(orgNames) {
		const groupLineItems = (group) => {
			/** @type LineItem[] */
			const items = [];

			const orgName = orgNames.get(group.organization) ?? '(Unknown)';
			const orgCountryCode = orgs.data.find(org => org._id === group.organization).countryCode ?? "US";

			const sizeStr = group.size == "8.5x11_bifold" ? '8.5x11 - Bifold' :group.size;

			const classStr = this.classStr(group);

			let id = UUID.generate();

			const formatCollateral = (item) => {
				return item;
			}

			/** @type LineItem */
			const baseItem = formatCollateral({
				id: id,

				orgID: group.organization,
				orgName,

				quantity: group.orderCount,
				mailType: 'Self Mailer',
				productDesc: `Self Mailer ${sizeStr} ${classStr}`,
				destinationCountryCode: group.destinationCountryCode,

				parentID: null,
				vendor: group.vendor,
				groupID: group._id,
				pages: null
			});

			items.push(baseItem);

			const innerItems = this.baseGroupItems(group, orgName, orgCountryCode);

			for (const item of innerItems) {
				const innerId = UUID.generate();
				items.push({
					...item,

					id: innerId,
					destinationCountryCode: null,

					parentID: baseItem.id,
					groupID: null,
					pages: null
				});
			}

			return items;
		};

		return this.mapGroups(selfMailerGroups.data, groupLineItems);
	},
	updateOrderInfo: async () => {
		await orgs.run();
		await letterGroups.run();
		await postcardGroups.run();
		await chequeGroups.run();		
		await selfMailerGroups.run();

		const orgNames = new Map(orgs.data.map((o) => [o._id, o.name]));

		const letters = this.letterGroupsLineItems(orgNames);
		const postcards = this.postcardGroupsLineItems(orgNames);
		const cheques = this.chequeGroupsLineItems(orgNames);
		const selfmailers = this.selfmailerGroupsLineItems(orgNames);

		const totalCollateral = letters.concat(postcards).concat(cheques).concat(selfmailers);

		let orderGroupIds = [];
		(await get_order_group_ids.run()).forEach(ID => {
			orderGroupIds.push(ID.OrderGroupID)
		});

		//get the organzization IDs for items created for today
		let organizationIDs = [];
		(await get_organization_ids.run()).forEach(ID => {
			organizationIDs.push(ID.OrgID)
		});

		//filter only the ones that are not currently added
		const newCollateral = [];
		let skipCurrent = true;
		let updateGroup = false;
		let groupToAdd = [];

		for(let order of totalCollateral){
			//check if parent or sub item
			if(order.groupID === null){
				//if this is an existing 
				if(updateGroup == true){
					groupToAdd.push(order);
				} else if(!skipCurrent){
					newCollateral.push(order);
				}
			} else {
				if(updateGroup === true){
					await storeValue('newList',JSON.parse(JSON.stringify(groupToAdd).replaceAll("'", "''")));
					await Promise.all([  
						set_customerprice.run(),
						set_customerlineitems.run(),
						set_printerlineitems.run(),
						set_envelope_inventory.run(),
					]).catch(() => {
						showAlert('Error! Unable to process.','error');
					});

					showAlert(`${groupToAdd[0].groupID} added for ${order.orgID}.`)

					updateGroup = false;
					groupToAdd = [];
				}

				// check if order group doesn't exist
				if(!orderGroupIds.includes(order.groupID)){
					//check if the org associated to this already has an item
					if(organizationIDs.includes(order.orgID)){
						updateGroup = true;
						groupToAdd.push(order);
					} else {
						skipCurrent = false;
						newCollateral.push(order);
					}
				} else {
					skipCurrent = true;
				}
			}
		}

		// final update if there is any more groups to be added
		if(updateGroup === true){
			const order = totalCollateral[totalCollateral.length - 1];
			await storeValue('newList',JSON.parse(JSON.stringify(groupToAdd).replaceAll("'", "''")));
			await Promise.all([
				set_customerprice.run(),
				set_customerlineitems.run(),
				set_printerlineitems.run(),
			]).catch(() => {
				showAlert('Error! Unable to process.','error');
			});

			showAlert(`${groupToAdd[0].groupID} added for ${order.orgID}.`)

			updateGroup = false;
			groupToAdd = [];
		}

		//show an alert on the screen if there are any new order groups
		showAlert(`There was ${newCollateral.length} Order Groups added.`)

		await storeValue('newList',JSON.parse(JSON.stringify(newCollateral).replaceAll("'", "''")));		

		if(newCollateral.length !== 0){
			Promise.all([
				set_newCustList.run(),
				set_newCustInvoice.run(),
				set_customerprice.run(),
				set_customerlineitems.run(),
				set_printerlineitems.run(),
			]).catch(() => {
				showAlert('Error! Unable to process.','error');
			});
		}

		showAlert(`There was ${newCollateral.length} Order Groups added.`)

		Promise.all([
			get_letter_day_volume.run(),
			get_cheque_day_volume.run(),
			get_postcard_day_volume.run(),
			get_invoicelist.run(),
			get_num_new_clients.run(),
			get_invoicelist_count.run(),
		]).then(() => {
			showAlert('Well done! Your action has been processed successfully.','success');
		})

	}
}
