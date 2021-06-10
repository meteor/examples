export class DateUtility
{
  /**
   * @param day {number}
   * @returns {Date}
   */
  static beforeDays(day = 1)
  {
    let date = new Date();
    date.setDate(date.getDate() - day);
    
    return date;
  }
}