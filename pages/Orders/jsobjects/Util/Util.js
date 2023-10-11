export default {
	clearPicker_orders: async () => {
		await resetWidget("FilePicker1");
		await storeValue('newList',undefined);
	},
	synchronize: async () => {
		await	get_user.run();
		await	get_user_department.run();
		storeValue('show','true')
		storeValue('show2','true')
		await storeValue('customerItems',undefined);
		await storeValue('printerItems',undefined)
	},
	autorefresh: async () => {
		setInterval(() => {
			get_letter_day_volume.run(),
				get_cheque_day_volume.run(), get_postcard_day_volume.run(),get_num_new_clients.run()}, 3000, "autoupdate");
		/*get_invoicelist_count.run()*/
	},
	selectedOrderGroup: async () => {
		await get_customer_order_details.run();
		await get_printer_order_details.run();
		await get_list_of_collaterals.run();
		await storeValue('org','f');
	},
	getSelectedCustomerItems: async () => {
		await get_customer_order_details.run();
		const customerItems = get_customer_order_details.data;
		const totalItem = customerItems.find(item => item.itemid === null)
		const parentItems = customerItems.filter(item => item.SubItemID === null && item.itemid !== null);
		let finalArray = [];
		let sort = 0;

		for(const parentItem of parentItems){
			const allItems = customerItems.filter(item => item.SubItemID === parentItem.itemid);
			finalArray.push({...parentItem, sort});
			sort += 1;
			for(const item of allItems){
				if(item.ProductDescription.includes('Extra') || item.ProductDescription.includes('add')){
					if(finalArray[finalArray.length - 1].SubItemID !== null){
						let parentIndex = 0;
						for (var i = finalArray.length - 1; i >= 0; i--) {
								if (finalArray[i].SubItemID === null) {
										parentIndex = i;
									break;
								}
						}
						
						for(let i = parentIndex + 1; i < finalArray.length; i++){
							if(i === parentIndex + 1){
								const sortNum = finalArray[i].sort;
								finalArray.splice(i, 0, {...item, sort: sortNum})
							} else {
								finalArray[i].sort += 1; 
							}
						}
					} else {
						finalArray.push({...item, sort});
						sort += 1;
					}
				} else {
					finalArray.push({...item, sort});
					sort += 1;
				}
			}
		}
		finalArray.push(totalItem);

		await storeValue('customerItems',finalArray);
	},
	getSelectedPrinterItems: async () => {
		await get_printer_order_details.run();
		const printerItems = await get_printer_order_details.data;
		const totalItem = printerItems.find(item => item.Id === null);
		const parentItems = printerItems.filter(item => item.SubItemID === null && item.Id !==null);
		const finalArray = [];
		let sort = 0;

		for(const parentItem of parentItems){
			const allItems = printerItems.filter(item => item.SubItemID === parentItem.Id);
			finalArray.push({...parentItem, sort});
			sort += 1;
			for(const item of allItems){
				if(item.ProductDescription.includes('Extra') || item.ProductDescription.includes('add')){
					if(finalArray[finalArray.length - 1].SubItemID !== null){
						let parentIndex = 0;
						for (var i = finalArray.length - 1; i >= 0; i--) {
								if (finalArray[i].SubItemID === null) {
										parentIndex = i;
									break;
								}
						}
						
						for(let i = parentIndex + 1; i < finalArray.length; i++){
							if(i === parentIndex + 1){
								const sortNum = finalArray[i].sort;
								finalArray.splice(i, 0, {...item, sort: sortNum})
							} else {
								finalArray[i].sort += 1; 
							}
						}
					} else {
						finalArray.push({...item, sort});
						sort += 1;
					}
				} else {
					finalArray.push({...item, sort});
					sort += 1;
				}
			}
		}
		finalArray.push(totalItem);

		await storeValue('printerItems',finalArray);
	},
	createNewItems: async () => {
		const uuid = UUID.generate();
		await storeValue("selectedDescription", Select1.selectedOptionLabel)
		await get_product_from_description.run();
		const product = get_product_from_description.data
		const newItem = {
			id: uuid,
			orgID: Table2.selectedRow.OrgID,
			orgName: Table2.selectedRow.CustomerName,

			quantity: Input2.text,
			mailType: product[0].MailType,
			productDesc: product[0].ProductDescription,
			destinationCountryCode: Input3.text,

			parentID: null,
			vendor: null,
			groupID: null,
			pages: null
		}

		await storeValue('newList',JSON.parse(JSON.stringify([newItem]).replaceAll("'", "''")));

		await Promise.all([
			set_customerprice.run(),
			set_customerlineitems.run(),
			set_printerlineitems.run(),
		]).catch(() => {
			showAlert('Error! Unable to process.','error');
		});

		await Util.getSelectedCustomerItems();
		await Util.getSelectedPrinterItems();
		await get_list_of_collaterals.run();
		await storeValue('org','f');
	},
	createNewSubItem: async () => {
		const uuid = UUID.generate();
		await storeValue("selectedDescription", Select1Copy.selectedOptionLabel)
		await get_product_from_description.run();
		const product = get_product_from_description.data

		const newItem = {
			id: uuid,

			orgID: Table2.selectedRow.OrgID,
			orgName: Table2.selectedRow.CustomerName,

			// For these, each sheet is additional, not just those after the first
			quantity: Input2Copy.text,
			mailType: product[0].MailType,
			productDesc: product[0].ProductDescription,
			destinationCountryCode: null,

			parentID: Table3Copy.selectedRow.itemid,
			groupID: null,
			pages: null
		}

		await storeValue('newList',JSON.parse(JSON.stringify([newItem]).replaceAll("'", "''")));

		await Promise.all([
			set_customerprice.run(),
			set_customerlineitems.run(),
			set_printerlineitems.run(),
		]).catch(() => {
			showAlert('Error! Unable to process.','error');
		});
	},
	updateOrders: async (vendorID, groupType, orderGroupIDs) => {
		const orderGroupType = groupType === 'letter' ?'lettergroups' : groupType === 'postcard' ? 'postcardgroups' : groupType === 'cheque' ? 'chequegroups' : 'selfmailergroups';
		const orderGroups = await findOrderGroups.run({
				orderGroupType,
				orderGroupIDs
		});
		
		for(const orderGroup of orderGroups){
			const orderType = groupType === 'letter' ?'letters' : groupType === 'postcard' ? 'postcards' : groupType === 'cheque' ? 'cheques' : 'selfmailers';
			
			const getOrderTypeParams = () => {
				if(groupType === 'letter') {
					return {
						pageCount: orderGroup.pageCount,
						doubleSided: orderGroup.doubleSided,
						color: orderGroup.color,
						envelopeType: orderGroup.envelopeType,
						perforatedPage: orderGroup.perforatedPage,
						returnEnvelope: orderGroup.returnEnvelope,
						customEnvelope: orderGroup.customerEnvelope,
						
					}
					
				} else if (groupType === 'cheque'){
					if(orderGroup.letterPageCount === 0){
						return {
							letter: {$exists:false},
							extraService: orderGroup.extraService,
							customEnvelope: orderGroup.customEnvelope,
						}
					} else {
						return {
							letter: {$exists:true},
							'letter.pageCount': orderGroup.letterPageCount,
							extraService: orderGroup.extraService,
							customEnvelope: orderGroup.customEnvelope,
						}
					}
				} 
				
				//postcards and selfmailers don't have anything custom to be added
				return{};
				
			};
			
			if(orderGroup.vendor === "CANCELLED" && vendorID !== "CANCELLED"){
				//change status on all orders 
					 await updateOrderStatus.run({
						orderType,
						find: {
							...getOrderTypeParams(),
							organization: orderGroup.organization,
							live: true,
							status: "cancelled",
							sendDate: {
								$gte: new Date(orderGroup.minOrderSendDate),
								$lte: new Date(orderGroup.maxOrderSendDate)
							},
							'to.countryCode': orderGroup.destinationCountryCode,
							express: orderGroup.express,
							size: orderGroup.size,
							mailingClass: orderGroup.mailingClass
						},
						update: {
							$set: {
								status: "printing",
							}
						}
					})
				//add the orders back to the org usage
				await updateOrgUsage.run({
					organization: orderGroup.organization,
					count: orderGroup.orderCount
				})
					
			} else if(vendorID !== "CANCELLED") {
				//change status on all orders 
				await updateOrderStatus.run({
						orderType,
						find: {
							...getOrderTypeParams(),
							organization: orderGroup.organization,
							live: true,
							status: "cancelled",
							sendDate: {
								$gte: new Date(orderGroup.minOrderSendDate),
								$lte: new Date(orderGroup.maxOrderSendDate)
							},
							'to.countryCode': orderGroup.destinationCountryCode,
							express: orderGroup.express,
							size: orderGroup.size,
							mailingClass: orderGroup.mailingClass
						},
						update: {
							$set: {
								status: "cancelled",
							}
						}
					})
				//remove the ordersfrom the org usage
				await updateOrgUsage.run({
					organization: orderGroup.organization,
					count: -orderGroup.orderCount
				})
			}
		}
		
		
		await updateOrderGroupsVendor.run({
			orderGroupIDs,
			vendorID,
			orderGroupType
		})
	}
}