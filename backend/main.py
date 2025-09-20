#!/usr/bin/env python3
"""
Main application file for the Financial News Analyzer
Generates professional financial reports in German document style
"""

from general_report_generator import GeneralReportGenerator


def main():
    """Main function to run the financial news analyzer."""
    
    print("🔍 Financial News Analyzer - Professional Report Generator")
    print("=" * 60)
    
    # Sample article for analysis
    article = """
    TikTok may have found a group to take over its US business. Under a framework deal set to be discussed by Donald Trump and Xi Jinping, the American operations of the Chinese social media platform would be acquired by a consortium including Oracle, Silver Lake and Andreessen Horowitz. The US president also signed an executive order extending the divestment deadline to Dec. 16.
    """
    
    try:
        print("📊 Analyzing article with LangGraph...")
        
        # Initialize the report generator
        generator = GeneralReportGenerator()
        
        # Generate the professional report
        analysis = generator.generate_general_report(
            article, 
            output_filename="professional_financial_report.pdf"
        )
        
        print("\n✅ Report generated successfully!")
        print("📈 Impact Level:", analysis['impact_level'])
        print("⏰ Time Horizon:", analysis['time_horizon'])
        print("🏭 Influenced Industries:", len(analysis['influenced_industries']))
        print("👥 Influenced Client Segments:", len(analysis['influenced_clients']))
        print("📄 Report saved as: professional_financial_report.pdf")
        
        # Display summary of analysis
        print("\n📋 Analysis Summary:")
        print("-" * 40)
        
        print("\n🏭 Top Affected Industries:")
        for industry in analysis['influenced_industries']:
            print(f"  • {industry['name']} - {industry['impact'].upper()} impact")
        
        print("\n👥 Client Segments at Risk:")
        for client in analysis['influenced_clients']:
            print(f"  • {client['segment']} - {client['risk_level'].upper()} risk")
        
    except Exception as e:
        print(f"❌ Error generating report: {str(e)}")
        print("Please check your OpenAI API key and dependencies.")
        return False
    
    return True


if __name__ == "__main__":
    success = main()
    if success:
        print("\n🎉 Analysis completed successfully!")
    else:
        print("\n💥 Analysis failed. Please check the error messages above.")