export default {
	PRINTER_SPECIAL_LETTER_CLIENTS: {
			AtoB: {
					file: () => 'CustomEnvelope_Color_SS_AtoB',
					folder: () => 'CustomEnvelope_Color_SS_AtoB',
			},
			'Highland Health Direct': {
					file: () => 'FC_BW_SS_FFW_HighlandHealthDirect',
					folder: () => 'FC_BW_SS_FFW_HighlandHealthDirect',
			},
			Clek: {
					file: () => 'CustomEnvelope_BW_DS_Clek',
					folder: () => 'CustomEnvelope_BW_DS_Clek',
			},
			'Pearl Health': {
					file: () => 'FC_BW_DS_PearlHealth',
					folder: () => 'FC_BW_DS_PearlHealth',
			},
			'Accompany Health Inc': {
					file: (order) =>
							this.generateCustomEnvelopeDetails(order, 'AccompanyHealthInc'),
					folder: (order) =>
							this.generateCustomEnvelopeDetails(order, 'AccompanyHealthInc'),
			},
			RazorMetrics: {
					file: (order) =>
							this.generateCustomEnvelopeDetails(order, 'RazorMetric'),
					folder: (order) =>
							this.generateCustomEnvelopeDetails(order, 'RazorMetric'),
			},
			Defendify: {
					file: (order) =>
							this.generateCustomEnvelopeDetails(order, 'Defendify'),
					folder: (order) =>
							this.generateCustomEnvelopeDetails(order, 'Defendify'),
			},
			Enter: {
					file: (order) =>
							this.generateCustomEnvelopeDetails(order, 'EnterHealth'),
					folder: (order) =>
							this.generateCustomEnvelopeDetails(order, 'EnterHealth'),
			},
			'Credit Glory Inc': {
					file: (order) =>
							this.generateCustomEnvelopeDetails(order, 'CreditGlory'),
					folder: (order) =>
							this.generateCustomEnvelopeDetails(order, 'CreditGlory'),
			},
			'Credit Sage LLC': {
					file: (order) =>
							this.generateCustomEnvelopeDetails(order, 'CreditSage'),
					folder: (order) =>
							this.generateCustomEnvelopeDetails(order, 'CreditSage'),
			},
		AnsibleHealth: {
        file: (order) =>
            this.generateCustomEnvelopeDetails(order, 'AnsibleHealth'),
        folder: (order) =>
            this.generateCustomEnvelopeDetails(order, 'AnsibleHealth'),
    },
	},
	PRINTER_SPECIAL_RETURN_ENVELOPES: {
    return_envelope_sxNVDhNFwREC3DWg9VCFHw: 'Titanvest_ReturnEnvelope',
    return_envelope_vesZZ3Xe5XfPeeArizdTDr: 'MyDMeDoc_ReturnEnvelope',
    return_envelope_fk8b7Zzgn8ReB7AZSea6xd: 'Newgent_ReturnEnvelope',
    return_envelope_aDv4CCz3mL9qhvQFFHuaUK: 'OttLawFirm_ReturnEnvelope',
    return_envelope_rvodu5mkpkHy2CEh33iKVE: 'OctopusEnergy_ReturnEnvelope',
    return_envelope_1PZgt4TraeTCn7rkeajzKb: 'MedxServicesInc_ReturnEnvelope',
    return_envelope_vGabY569VBDwfA36RcBqFr: 'SwyftConnect_Previous',
    return_envelope_fMi8JJ3ijRPjkW1vKaXzEt: 'SwyftConnect',
    return_envelope_mkG3NHTZZUnaz6jahkJRX5: 'BridgingCare_ReturnEnvelope',
    return_envelope_9KgsgkKFe5YYuT2QLuZbdq: 'SylvanHealth_ReturnEnvelope',
    return_envelope_bcp8aBYRMfj3whMbujzgrh: 'LumataHealth_ReturnEnvelope',
    return_envelope_9pYHUhvXvskMGTWC62vQfE: 'VyncaCare_ReturnEnvelope',
    return_envelope_v6PXxXjihDy4RwMKNyPcn1: 'Somos_ReturnEnvelope',
    return_envelope_88rHHgyVvfXnGhsqYR8vxv: 'BlueAlley_ReturnEnvelope',
},
	generateCSV: async () => {
		const orgNames = await getOrgNames.run();
		//Get all the orders for the date selected assigned to Quantum
		const printerLineItems = await getQuantumOrders.run({date: BatchDatePicker.formattedDate});
		
		let finalOutput = [];
		
		const letterOrderGroups = [];
		const postcardOrderGroups = [];
		const chequeOrderGroups = [];
		const selfMailerOrderGroups = [];
		
		for(const printerLineItem of printerLineItems) {
			if(printerLineItem.OrderGroupID.startsWith('letter_group_')){
				letterOrderGroups.push(printerLineItem);
			} else if(printerLineItem.OrderGroupID.startsWith('postcard_group_')){
				postcardOrderGroups.push(printerLineItem);
			} else if(printerLineItem.OrderGroupID.startsWith('cheque_group_')){
				chequeOrderGroups.push(printerLineItem);
			} else if(printerLineItem.OrderGroupID.startsWith('self_mailer_group_')){
				selfMailerOrderGroups.push(printerLineItem);
			} else {
				console.error(`${printerLineItem.Id} has an incorrect / missing OrderGroupID ${printerLineItem.OrderGroupID}`)
				showAlert(
					`${printerLineItem.Id} has an incorrect / missing OrderGroupID ${printerLineItem.OrderGroupID}`,
					'error'
				);
			}
		}
		
		if(letterOrderGroups.length > 0){
			finalOutput = finalOutput.concat(await this.retrieveOrderGroupInformation(orgNames, letterOrderGroups, 'lettergroups'))
		}
		
		if(postcardOrderGroups.length > 0){
			finalOutput = finalOutput.concat(await this.retrieveOrderGroupInformation(orgNames, postcardOrderGroups, 'postcardgroups'))
		}
		
		if(chequeOrderGroups.length > 0){
			finalOutput = finalOutput.concat(await this.retrieveOrderGroupInformation(orgNames, chequeOrderGroups, 'chequgroups'))
		}
		
		if(selfMailerOrderGroups.length > 0){
			finalOutput = finalOutput.concat(await this.retrieveOrderGroupInformation(orgNames, selfMailerOrderGroups, 'selfmailergroups'))
		}
		
		await storeValue('QuantumCSV', finalOutput);
	},
	retrieveOrderGroupInformation: async (orgNames, printerLineItems, orderGroupType) => {
		const orderGroups = await getOrderGroups.run({
			orderGroupType,
			printerLineItems: printerLineItems
		});
		
		return this.groupDownloadsByPath(orgNames, orderGroups, orderGroupType)
	},
	quantumLetterPath: (orgNames, orderGroup) => {
	const organization = orgNames.find(org => org._id === orderGroup.organization);
		
		const letterDetails =
					this.PRINTER_SPECIAL_LETTER_CLIENTS[organization.name]?.folder(orderGroup) ||
					this.genericVendorLetterDetails(orderGroup);
		
		return `${organization._id}_${letterDetails.replace(/_/g, '')}_${this.formatDate(
        moment(BatchDatePicker.formattedDate).toDate()
    )}.zip`;
	},
formatDate: (date) => {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}${day}${year}`;
},
generateCustomEnvelopeDetails: ( orderGroup, organizationEnvelopeAlias) => {
    const genericMailingClass = this.genericMailingClassForOrder(orderGroup.mailingClass);

    return `${
        genericMailingClass === 'first_class' ? 'FC' : 'SC'
    }_${orderGroup.color ? 'Color' : 'BW'}_${
        orderGroup.doubleSided ? 'DS' : 'SS'
    }_${organizationEnvelopeAlias}`;
},
genericVendorLetterDetails: (orderGroup) => {
    const colorStr = orderGroup.color ? 'Color' : 'BW';
    const sidedStr = orderGroup.doubleSided ? 'DS' : 'SS';
    const certifiedStr = this.solutionsIncSpecializationString(orderGroup);
    const mailingClassStr = this.mailingClassString(orderGroup);

    const detailsExcludingCertified = `${mailingClassStr}_${colorStr}_${sidedStr}`;

    const resCertified = `${detailsExcludingCertified}_${certifiedStr}`;

    const res = orderGroup.envelopeType === "flat" ? `${resCertified}_flat` : resCertified;

    return orderGroup.size === "us_legal" ? `${res}_Legal` : res;
},
solutionsIncSpecializationString : (orderGroup) => {
    if (!orderGroup.extraService && !orderGroup.perforatedPage && !orderGroup.returnEnvelope) {
        return 'Generic';
    }

    let res =
        orderGroup.extraService?.split('_').reduce(
                (prev, cur) =>
                    prev + cur.charAt(0).toUpperCase() + cur.slice(1),
                '_'
            ).concat('Mail') || '';

    if (orderGroup.returnEnvelope) {
        const envelopeName =
            this.PRINTER_SPECIAL_RETURN_ENVELOPES[orderGroup.returnEnvelope] ??
            `${
                (orderGroup.returnEnvelope).split('_').slice(-1)[0]
            }_ReturnEnvelope`;

        res += `_${envelopeName}`;
    }

    if (orderGroup.perforatedPage) {
        res += '_PerforatedPaper';
    }

    return res.slice(1);
},
mailingClassString: (orderGroup) => {
    if (
        orderGroup.express ||
        (orderGroup.mailingClass && this.isExpressMailingClass(orderGroup.mailingClass))
    ) {
        return 'Express';
    }

    const genericMailingClass = this.genericMailingClassForOrder(orderGroup.mailingClass);

    if (!genericMailingClass) {
        return '';
    }

    return genericMailingClass === 'first_class' ? 'FC' : genericMailingClass === 'standard_class' ? 'SC' : '';
},
isExpressMailingClass: (mailingClass) => {
    switch (mailingClass) {
        case 'express':
        case 'usps_express_2_day':
        case 'usps_express_3_day':
        case 'ups_express_2_day':
        case 'ups_express_3_day':
        case 'ups_express_overnight':
            return true;
        default:
            return false;
    }
},
genericMailingClassForOrder:(mailingClass) => {
    switch (mailingClass) {
        case 'first_class':
        case 'usps_first_class':
        case 'royal_mail_first_class':
        case 'usps_first_class_certified':
        case 'usps_first_class_registered':
        case 'usps_first_class_certified_return_receipt':
            return 'first_class';
        case 'standard_class':
        case 'usps_standard_class':
            return 'standard_class';
        default:
            return null;
    }
},
quantumPostcardPath: (orderGroup) => {
    const genericMailingClass = this.genericMailingClassForOrder(orderGroup.mailingClass);

    return `${orderGroup.organization}_${
        genericMailingClass === 'first_class' ? 'FC' : 'SC'
    }_${orderGroup.size}${orderGroup.express ? '_EX' : ''}_${this.formatDate(
        moment(BatchDatePicker.formattedDate).toDate()
    )}.zip`;
},
groupDownloadsByPath: (orgNames, orderGroups, orderGroupType) => {
    let pathDownloads = [];

    for (const orderGroup of orderGroups) {
			const path = orderGroupType === 'lettergroups' ? this.quantumLetterPath(orgNames, orderGroup) : this.quantumPostcardPath(orderGroup)
			const found = pathDownloads.findIndex(pathDownload => pathDownload.OrderPackageName === path);
			
			console.log('JG pathDownloads', pathDownloads)
			console.log('JG path', path)
			
			if(found === -1){
				pathDownloads.push({
					OrderPackageName: path,
					Total: orderGroup.orderCount
				})
			} else {
				pathDownloads[found].Total += orderGroup.orderCount
			}
    }

    console.log('Grouped downloads into', pathDownloads.length, 'paths.');

    return pathDownloads;
}
}