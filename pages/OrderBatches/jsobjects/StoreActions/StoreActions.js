export default {
	setSkippedOrderNumbers: async () => {
		await storeValue('chequesSkipCount',0);
		await storeValue('lettersSkipCount',0);
		await storeValue('postcardsSkipCount',0);
		await storeValue('selfmailersSkipCount',0);
	},
	updateSkippedOrder: async (type, amount) => {
		switch(type){
      	case 'letter':
					await storeValue('lettersSkipCount', appsmith.store.lettersSkipCount + amount)
					await letters.run()
      		break;
				case 'postcard':
					await storeValue('postcardsSkipCount', appsmith.store.postcardsSkipCount + amount)
					await postcards.run()
      		break;
				case 'cheque':
					await storeValue('chequesSkipCount', appsmith.store.chequesSkipCount + amount)
					await cheques.run()
      		break;
				case 'selfmailer':
					await storeValue('selfmailersSkipCount', appsmith.store.selfmailersSkipCount + amount)
					await selfmailers.run()
      		break;
      }
	},
	getOrderBatches: async () => {
		if(moment(StartDate_Picker.selectedDate).isAfter(moment(EndDate_Picker.selectedDate))){
			showAlert("Start Date can not come after End Date", "error");
		}

		const dateStrings = [];
		const diff = moment(EndDate_Picker.selectedDate).diff(moment(StartDate_Picker.selectedDate), 'days');

		for(let i = 0; i <= diff; i++){
			const newDate = moment(StartDate_Picker.selectedDate).add(i, 'days')
			dateStrings.push(moment(newDate).format("YYYY_MM_DD"));
		}

		const allBatches = [];
		for(let date of dateStrings){
			const batches = await Get_All_Batches.run({date: date});
			if(Printer_Select.selectedOptionValue !== '' && Printer_Select.selectedOptionValue !== 'all'){
				//filter for printer
				switch(Printer_Select.selectedOptionLabel) {
					case 'Addressers':
						allBatches.push(...batches.filter(batch => batch.includes('Addressers')))
						break;
					case 'PrintNow':
					case 'Arc Mailing':
					case 'MBE Perth':
						allBatches.push(...batches.filter(batch => /^((?!Addressers|DSPB|DP|IMS|QuantumGroup|Xpressdocs|1Vision|directworx).)*$/.test(batch.fileName)))
						break;
					case 'SolutionsInMail':
						allBatches.push(...batches.filter(batch => /DSPB|DP/.test(batch.fileName)))
						break;
					case 'IMS Direct':
						allBatches.push(...batches.filter(batch => batch.fileName.includes('IMS')))
						break;
					case 'Quantum Group':
						allBatches.push(...batches.filter(batch => batch.fileName.includes('QuantumGroup')))
						break;
					case 'Xpressdocs':
						allBatches.push(...batches.filter(batch => batch.fileName.includes('Xpressdocs')))
						break;
					case '1Vision':
						allBatches.push(...batches.filter(batch => batch.fileName.includes('1Vision')))
						break;
					case 'Directworx':
						allBatches.push(...batches.filter(batch => batch.fileName.includes('directworx')))
						break;
				}

			} else {
				allBatches.push(...batches)
			}
		}

		await storeValue('orderBatches',allBatches);
		return;
	}
}
