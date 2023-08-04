export default {
	myFun1: async (currentRow) => {
		await storeValue("rowUpdate",currentRow);
		await Save_Data.run({currentRow});
		await get_customer_order_details.run();
		await get_PauseCancel_custOrderDetai.run();
		await get_printer_order_details.run();

		// add mongo connection and update the vendor for this
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
	clearOrderGroupVendor: async (currentRow) => {
		await Save_Data.run({currentRow: {
			AssignTo: "",
			itemid: currentRow.itemid
		}});

		const orderGroupIDs = [(await get_printer_line_item.run({currentRow}))[0].OrderGroupID];

		if(orderGroupIDs.length > 0){
			const groupType = orderGroupIDs[0].slice(0, orderGroupIDs[0].indexOf("_"));

			if(groupType === 'letter'){
				await Update_LetterGroup.run({
					orderGroupID: orderGroupIDs,
					vendorID: ""
				});
			} else if(groupType === 'postcard'){
				await Update_PostcardGroup.run({
					orderGroupID: orderGroupIDs,
					vendorID: ""
				});
			} else {
				await Update_ChequeGroup.run({
					orderGroupID: orderGroupIDs,
					vendorID: ""
				});
			}
		}

	},
	updateOrderGroupVendors: async () => {
		const orderGroupIDs = await Promise.all(Table3Copy.tableData.slice(0, -1).map(async (currentRow) => {
			return (await get_printer_line_item.run({currentRow}))[0].OrderGroupID;
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

			// Renumber the IDs
			for (const item of groupItems) {
				item.id += items.length;
				if (item.parentID) {
					item.parentID += items.length;
				}
			}

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

		if (
			(group.destinationCountryCode !== 'US' &&
			 group.destinationCountryCode !== 'CA' &&
			 group.destinationCountryCode !== 'GB' &&
			 group.destinationCountryCode !== 'AU') || 
			group.destinationCountryCode !== orgCountryCode
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

			let id = 0;

			const generateSheetCount = () => {
				return group.doubleSided
					? Math.ceil(group.pageCount / 2)
				: group.pageCount;
			}

			const formatCollateral = (item) => {
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
					} else if(sheetCount >= 20){
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
			}

			/** @type LineItem */
			const baseItem = formatCollateral({
				id: ++id,

				orgID: group.organization,
				orgName,

				quantity: group.orderCount,
				mailType: 'Letter',
				productDesc: `${sizeStr} - ${colorDoubleSidedStr} - ${classStr}`,
				destinationCountryCode: group.destinationCountryCode,

				parentID: null,
				vendor: group.vendor,
				groupID: group._id,
			});

			items.push(baseItem);

			const innerItems = this.baseGroupItems(group, orgName, orgCountryCode);

			for (const item of innerItems) {
				items.push({
					...item,

					id: ++id,
					destinationCountryCode: null,

					parentID: baseItem.id,
					groupID: null,
				});
			}

			// TODO(Apaar): Is Math.ceil robust enough for our use case? Is there ever
			// a scenario where 4 / 2 could be rounded to 3?
			const sheetCount = group.doubleSided ? Math.ceil(group.pageCount / 2)
			: group.pageCount;

			if (sheetCount > 1) {
				/** @type {LineItem} */
				const addlSheetItem = formatCollateral({
					id: ++id,

					orgID: group.organization,
					orgName,

					quantity: group.orderCount * (sheetCount - 1),
					mailType: "Add'l Page",
					productDesc: `${sizeStr} - Extra Sheet ${colorDoubleSidedStr}`,
					destinationCountryCode: null,

					parentID: baseItem.id,
					groupID: null,
				});

				items.push(addlSheetItem);

				if (sheetCount > 6) {
					/** @type {LineItem} */
					const oversizedItem = formatCollateral({
						id: ++id,

						orgID: group.organization,
						orgName,

						quantity: group.orderCount,
						mailType: 'Added Services',
						productDesc: 'Oversized (over 6 sheets)',
						destinationCountryCode: null,

						parentID: baseItem.id,
						groupID: null,
					});

					if(group.organization === "org_3pWY3piAx4H7XNrpY25RU2" && sheetCount >= 20 || (group.organization !== "org_3pWY3piAx4H7XNrpY25RU2" && sheetCount > 6 && group.organization !== "org_wUB4oa68YQgdQNYTeiSYNQ")){
						items.push(oversizedItem);
					}
				}
			}

			if (group.perforatedPage) {
				/** @type {LineItem} */
				const perforatedItem = {
					id: ++id,

					orgID: group.organization,
					orgName,

					quantity: group.orderCount,
					mailType: 'Added Services',
					productDesc: 'Perforated',
					destinationCountryCode: null,

					parentID: baseItem.id,
					groupID: null,
				};

				items.push(perforatedItem);
			}

			if (group.returnEnvelope) {
				// TODO(Apaar): In the future the product desc may change to be more specific to orgs

				/** @type {LineItem} */
				const returnEnvelopeItem = {
					id: ++id,

					orgID: group.organization,
					orgName,

					quantity: group.orderCount,
					mailType: 'Return Envelope',

					// We only seem to specify org in US
					productDesc: `${
					group.destinationCountryCode === 'US' ? orgName + ' '
					: ''
				}#9 Envelope`,
					destinationCountryCode: null,

					parentID: baseItem.id,
					groupID: null,
				};

				items.push(returnEnvelopeItem);
			}

			// Country Canvas Awnings and Highland Health Direct use a custom envelope
			if (
				group.organization === 'org_qv6KSxaXeXpGt7b1gE8eez' ||
				group.organization === 'org_cbjmTDDQbfRFkd8pkYHNvi'
			) {
				/** @type {LineItem} */
				const customEnvelopeItem = {
					id: ++id,

					orgID: group.organization,
					orgName,

					quantity: group.orderCount,
					mailType: 'Custom Envelope',
					productDesc: orgName.includes('Country') ? 
					`${orgName} #10 Envelope`
					: `${orgName} Full Front Window Envelope`,
					destinationCountryCode: null,

					parentID: baseItem.id,
					groupID: null,
				};

				items.push(customEnvelopeItem);
			}

			return items;
		};

		return this.mapGroups(letterGroups.data, groupLineItems);
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

			let id = 0;

			const formatCollateral = (item) => {
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
					console.log("JG CRC", item)
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
			}

			/** @type LineItem */
			const baseItem = formatCollateral({
				id: ++id,

				orgID: group.organization,
				orgName,

				quantity: group.orderCount,
				mailType: 'Postcard',
				productDesc: `Postcard ${sizeStr} - ${classStr}`,
				destinationCountryCode: group.destinationCountryCode,

				parentID: null,
				vendor: group.vendor,
				groupID: group._id,
			});

			items.push(baseItem);

			const innerItems = this.baseGroupItems(group, orgName, orgCountryCode);

			for (const item of innerItems) {
				items.push({
					...item,

					id: ++id,
					destinationCountryCode: null,

					parentID: baseItem.id,
					groupID: null,
				});
			}

			// kimkim.com's postcards are laminated
			if (group.organization === 'org_6pFGLJ6c1N6zT1xrrRYKe9') {
				/** @type {LineItem} */
				const lamItem = {
					id: ++id,

					orgID: group.organization,
					orgName,

					quantity: group.orderCount,
					mailType: 'Added Services',
					productDesc: `${sizeStr} Lamination`,
					destinationCountryCode: null,

					parentID: baseItem.id,
					groupID: null,
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

			let id = 0;

			/** @type LineItem */
			const baseItem = {
				id: ++id,

				orgID: group.organization,
				orgName,

				quantity: group.orderCount,
				mailType: 'Cheque',
				productDesc: `${sizeStr} - Cheque Only - ${classStr}`,
				destinationCountryCode: group.destinationCountryCode,

				parentID: null,
				vendor: group.vendor,
				groupID: group._id,
			};

			items.push(baseItem);

			const innerItems = this.baseGroupItems(group, orgName, orgCountryCode);

			for (const item of innerItems) {
				items.push({
					...item,

					id: ++id,

					parentID: baseItem.id,
					groupID: null,
				});
			}

			if (group.letterPageCount) {
				// Assume BW SS for cheque letters
				const sheetCount = group.letterPageCount;

				/** @type {LineItem} */
				const addlSheetItem = {
					id: ++id,

					orgID: group.organization,
					orgName,

					// For these, each sheet is additional, not just those after the first
					quantity: group.orderCount * sheetCount,
					mailType: "Add'l Page",
					productDesc: `${sizeStr} - Cheque add'l Sheet`,
					destinationCountryCode: null,

					parentID: baseItem.id,
					groupID: null,
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

			let id = 0;

			const formatCollateral = (item) => {
				return item;
			}

			/** @type LineItem */
			const baseItem = formatCollateral({
				id: ++id,

				orgID: group.organization,
				orgName,

				quantity: group.orderCount,
				mailType: 'Selfmailer',
				productDesc: `Self Mailer ${sizeStr} ${classStr}`,
				destinationCountryCode: group.destinationCountryCode,

				parentID: null,
				vendor: group.vendor,
				groupID: group._id,
			});

			items.push(baseItem);

			const innerItems = this.baseGroupItems(group, orgName, orgCountryCode);

			for (const item of innerItems) {
				items.push({
					...item,

					id: ++id,
					destinationCountryCode: null,

					parentID: baseItem.id,
					groupID: null,
				});
			}
			
			return items;
		};

		return this.mapGroups(selfMailerGroups.data.data, groupLineItems);
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

		/**
         * @param {LineItem[]} items
         * @param {number} base
         */
		const renumberItems = (items, base) => {
			for (const item of items) {
				item.id += base;
				if (item.parentID) {
					item.parentID += base;
				}
			}
		};

		renumberItems(postcards, letters.length);
		renumberItems(cheques, letters.length + postcards.length);
		renumberItems(selfmailers, letters.length + postcards.length + cheques.length);

		const totalCollateral = letters.concat(postcards).concat(cheques).concat(selfmailers);

		let orderGroupIds = [];
		(await get_order_group_ids.run()).forEach(ID => {
			orderGroupIds.push(ID.OrderGroupID)
		});

		let organizationIDs = [];
		(await get_organization_ids.run()).forEach(ID => {
			organizationIDs.push(ID.OrgID)
		});

		//filter only the ones that are not currently added
		const newCollateral = [];
		let skipCurrent = true;
		let updateGroup = false;
		let groupToAdd = [];
		let newNumbering = 0;

		for(let order of totalCollateral){
			if(order.groupID === null){
				//check if the org associated to this order exists
				if(updateGroup == true){
					++newNumbering;
					groupToAdd.push({...order, id: newNumbering, parentID: groupToAdd[0].id});
				} else if(!skipCurrent){
					newCollateral.push(order);
				}
			} else {
				if(updateGroup === true){
					await storeValue('newList',JSON.parse(JSON.stringify(groupToAdd).replaceAll("'", "''")));
					await reset_Id_sequence.run();
					await Promise.all([  
						set_customerprice.run(),
						set_customerlineitems.run(),
						set_printerlineitems.run(),
						set_envelope_inventory.run(),
					]).catch(() => {
						showAlert('Error! Unable to process.','error');
					});

					showAlert(`${groupToAdd[0].groupID} added for ${order.orgID}.`)

					newNumbering = 0;
					updateGroup = false;
					groupToAdd = [];
				}

				if(!orderGroupIds.includes(order.groupID)){
					//check if the org associated to this order exists
					if(organizationIDs.includes(order.orgID)){
						++newNumbering;
						updateGroup = true;
						groupToAdd.push({...order, id: newNumbering});
					} else {
						skipCurrent = false;
						newCollateral.push(order);
					}
				} else {
					skipCurrent = true;
				}
			}
		}
		if(updateGroup === true){
			const order = totalCollateral[totalCollateral.length - 1];
			await storeValue('newList',JSON.parse(JSON.stringify(groupToAdd).replaceAll("'", "''")));
			await reset_Id_sequence.run();
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

		//show an alert on the screen if there are any new order groups
		showAlert(`There was ${newCollateral.length} Order Groups added.`)

		await storeValue('newList',JSON.parse(JSON.stringify(newCollateral).replaceAll("'", "''")));		

		if(newCollateral.length !== 0){
			await reset_Id_sequence.run();
			Promise.all([
				set_newCustList.run(),
				set_newCustInvoice.run(),
				set_customerprice.run(),
				set_customerlineitems.run(),
				set_printerlineitems.run(),
				set_envelope_inventory.run(),
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
