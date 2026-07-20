/** Order-history row for the account club card (order domain — passed in from the account page;
 *  the reward state comes from the rewards snapshot on the current user). */
export type PurchaseHistoryRow = {
	id: string;
	date: string;
	description: string;
	totalMinor: number;
	currency: string;
};
