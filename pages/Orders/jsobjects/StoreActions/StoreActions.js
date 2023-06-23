export default {
	myFun1: async (currentRow) => {
		await storeValue("rowUpdate",currentRow);
		await Save_Data.run({currentRow});
		await get_customer_order_details.run();
		await get_PauseCancel_custOrderDetai.run();
		await get_printer_order_details.run();

		// add mongo connection and update the vendor for this
		const orderGroupIDs = [(await get_printer_line_item.run({currentRow}))[0].OrderGroupID];
		console.log("JG", orderGroupIDs, currentRow);
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
	updateOrderGroupVendors: async () => {
		const orderGroupIDs = await Promise.all(Table3Copy.tableData.slice(0, -1).map(async (row) => {
			return (await get_printer_line_item.run({row}))[0].OrderGroupID;
		}));
		
		const letterOrderGroups = [];
		const postcardOrderGroups = [];
		const chequeOrderGroups = [];
		
		orderGroupIDs.foreach(orderGroupID => {
			const groupType = orderGroupID.slice(0, orderGroupID.indexOf("_"));
			if(groupType === 'letter'){
				letterOrderGroups.push(orderGroupID);
			} else if(groupType === 'postcard'){
				postcardOrderGroups.push(orderGroupID);
			} else {
				chequeOrderGroups.push(orderGroupID);
			}
		});

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
	baseGroupItems(group, orgName) {
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
			group.destinationCountryCode !== 'US' &&
			group.destinationCountryCode !== 'CA' &&
			group.destinationCountryCode !== 'GB' &&
			group.destinationCountryCode !== 'AU'
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
	letterGroupsLineItems() {
		/** @type Map<string, string> */
		const orgNames = new Map(orgs.data.map((o) => [o._id, o.name]));

		/** @param {LetterGroup} group */
		const groupLineItems = (group) => {
			/** @type {LineItem[]} */
			const items = [];

			const orgName = orgNames.get(group.organization) ?? '(Unknown)';

			const sizeStr = {
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

			const innerItems = this.baseGroupItems(group, orgName);

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
			const sheetCount = group.doubleSided
			? Math.ceil(group.pageCount / 2)
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
					group.destinationCountryCode === 'US'
					? orgName + ' '
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
					productDesc: orgName.includes('Country')
					? `${orgName} #10 Envelope`
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
	postcardGroupsLineItems() {
		/** @type Map<string, string> */
		const orgNames = new Map(orgs.data.map((o) => [o._id, o.name]));

		/** @param {PostcardGroup} group */
		const groupLineItems = (group) => {
			/** @type LineItem[] */
			const items = [];

			const orgName = orgNames.get(group.organization) ?? '(Unknown)';

			const sizeStr = group.size.split('').reverse().join('');
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

			const innerItems = this.baseGroupItems(group, orgName);

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

	chequeGroupsLineItems() {
		/** @type Map<string, string> */
		const orgNames = new Map(orgs.data.map((o) => [o._id, o.name]));

		/** @param {ChequeGroup} group */
		const groupLineItems = (group) => {
			/** @type LineItem[] */
			const items = [];

			const orgName = orgNames.get(group.organization) ?? '(Unknown)';

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

			const innerItems = this.baseGroupItems(group, orgName);

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
	updateOrderInfo: async () => {
		console.log("JG start", DatePicker1.selectedDate)
		await orgs.run();
		await letterGroups.run();
		await postcardGroups.run();
		await chequeGroups.run();		
		console.log("JG orgs", orgs.data)
		console.log("JG letterGroups", letterGroups.data)

		const letters = this.letterGroupsLineItems();
		const postcards = this.postcardGroupsLineItems();
		const cheques = this.chequeGroupsLineItems();


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

		const totalCollateral = letters.concat(postcards).concat(cheques);

		let orderGroupIds = [];
		(await get_order_group_ids.run()).forEach(ID => {
			orderGroupIds.push(ID.OrderGroupID)
		})

		const enter = totalCollateral.filter(order => order.orgID === 'org_iRzUYiZvDusyts2gVnUUCL')
		console.log("JG CM", enter)
		
		const parents = totalCollateral.filter(order => order.orgID !== null);
		console.log("JG parents", parents.length)

		console.log("JG totalCollateral", totalCollateral);
		console.log("JG orderGroupIds", orderGroupIds.length);
		console.log("JG orderGroupIds", orderGroupIds.includes("letter_group_8tF3KuUbFsDYtLq4Ehyots"));
		//filter only the ones that are not currently added
		const newCollateral = [];
		let skipCurrent = false;

		totalCollateral.forEach(order => {
			if(order.groupID === null){
				if(!skipCurrent){
					newCollateral.push(order)
				}
			} else {
				if(!orderGroupIds.includes(order.groupID)){
					skipCurrent = false;
					newCollateral.push(order);
				} else {
					skipCurrent = true;
				}
			}
		});

		//show an alert on the screen if there are any new order groups
		console.log("JG newCollateral", newCollateral.length, newCollateral);
		showAlert(`There was ${newCollateral.length} Order Groups added.`)

		await storeValue('newList',JSON.parse(JSON.stringify(newCollateral).replaceAll("'", "''")));		

		if(newCollateral.length !== 0){
			Promise.all([
				set_newCustList.run(),
				set_newCustInvoice.run(),
				set_customerprice.run(),
				set_customerlineitems.run(),
				set_printerlineitems.run(),
				set_envelope_inventory.run(),
			]).then(() => {
				get_letter_day_volume.run();
				get_cheque_day_volume.run();
				get_postcard_day_volume.run();
				get_invoicelist.run();
				get_num_new_clients.run();
				get_invoicelist_count.run();
				showAlert('Well done! Your action has been processed successfully.','success');
			}).catch(() => {
				showAlert('Error! Unable to process.','error');
			});
		}

	}
}
