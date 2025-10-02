import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import PropTypes from 'prop-types';
import { assets } from '../assets/assets';

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  logo: {
    width: 100,
    height: 50,
    marginBottom: 10,
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  orderInfo: {
    marginBottom: 20,
  },
  customerInfo: {
    marginBottom: 20,
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableCol: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  tableCell: {
    margin: 'auto',
    marginTop: 5,
    fontSize: 10,
  },
  total: {
    marginTop: 20,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#666',
  },
});

const Invoice = ({ order, currency }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Image style={styles.logo} src={assets.logo} />
        <Text style={styles.title}>Shop-from-Home</Text>
        <Text style={styles.subtitle}>Invoice</Text>
      </View>

      <View style={styles.orderInfo}>
        <Text>Order ID: {order._id}</Text>
        <Text>Date: {new Date(order.date).toLocaleDateString()}</Text>
        <Text>Payment Method: {order.paymentMethod}</Text>
        <Text>Payment Status: {order.payment ? 'Paid' : 'Pending'}</Text>
        <Text>Order Status: {order.status}</Text>
      </View>

      <View style={styles.customerInfo}>
        <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Customer Information:</Text>
        <Text>{order.address.firstName} {order.address.lastName}</Text>
        <Text>{order.address.street}</Text>
        <Text>{order.address.city}, {order.address.state}, {order.address.country}, {order.address.zipcode}</Text>
        <Text>Phone: {order.address.phone}</Text>
      </View>

      <View style={styles.section}>
        <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Order Items:</Text>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>Item</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>Size</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>Quantity</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>Price</Text>
            </View>
          </View>

          {order.items.map((item, index) => (
            <View style={styles.tableRow} key={index}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{item.name}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{item.size}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{item.quantity}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{currency}{item.price}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.total}>Total Amount: {currency}{order.amount}</Text>
      </View>

      <View style={styles.footer}>
        <Text>Thank you for shopping with Shop-from-Home!</Text>
        <Text>For any queries, contact us at contact@shopfromhome.com</Text>
      </View>
    </Page>
  </Document>
);

Invoice.propTypes = {
  order: PropTypes.object.isRequired,
  currency: PropTypes.string.isRequired,
};

export default Invoice;
